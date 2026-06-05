import type { Response } from 'express';
import type { AppLocale } from '@talim/types';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  searchSimilarChunks,
  mergeSimilarChunks,
  buildRagContext,
} from '../services/rag.service.js';
import { streamTutorWithTools } from '../services/ai.service.js';
import { serializeGraphBlock } from '../lib/tutor-graph.js';
import { buildTutorSystemMessage } from '../lib/locale-prompts.js';
import { getParam } from '../lib/params.js';
import { resolveLocale } from '../lib/locale.js';

const streamSchema = z.object({
  contentId: z.string().min(1),
  message: z.string().min(1),
  sessionId: z.string().optional(),
  selectedExcerpt: z.string().max(4000).optional(),
  selectedImage: z.string().max(2_000_000).optional(),
  locale: z.enum(['uz', 'en', 'ru']).optional(),
});

export async function getOrCreateSession(
  userId: string,
  contentId: string,
  locale: AppLocale,
  sessionId?: string,
): Promise<string> {
  if (sessionId) {
    const existing = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId, contentId, locale },
    });
    if (existing) return existing.id;
  }

  const existingForLocale = await prisma.chatSession.findFirst({
    where: { userId, contentId, locale },
  });
  if (existingForLocale) return existingForLocale.id;

  const session = await prisma.chatSession.create({
    data: { userId, contentId, locale },
  });
  return session.id;
}

export async function getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const sessionId = getParam(req, 'sessionId');
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId: req.user.userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!session) throw new AppError(404, 'Session not found');

  res.json({
    messages: session.messages.map((m) => ({
      id: m.id,
      sessionId: m.sessionId,
      role: m.role,
      text: m.text,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function streamChat(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const body = streamSchema.parse(req.body);

  const content = await prisma.content.findFirst({
    where: { id: body.contentId, userId: req.user.userId, status: 'READY' },
  });
  if (!content) throw new AppError(404, 'Content not found or not ready');

  const locale = (body.locale ?? resolveLocale(req)) as AppLocale;

  const sessionId = await getOrCreateSession(
    req.user.userId,
    body.contentId,
    locale,
    body.sessionId,
  );

  await prisma.chatMessage.create({
    data: { sessionId, role: 'USER', text: body.message },
  });

  const history = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  const messageChunks = await searchSimilarChunks(body.contentId, body.message);
  const excerptChunks =
    !body.selectedImage && body.selectedExcerpt?.trim()
      ? await searchSimilarChunks(body.contentId, body.selectedExcerpt)
      : [];
  const chunks = excerptChunks.length
    ? mergeSimilarChunks(excerptChunks, messageChunks)
    : messageChunks;
  const context = buildRagContext(chunks, locale);

  const messages = [
    {
      role: 'system' as const,
      content: buildTutorSystemMessage(
        locale,
        context,
        body.selectedExcerpt,
        Boolean(body.selectedImage),
      ),
    },
    ...history.map((m, index) => {
      const role = (m.role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant';
      const isLatestUser =
        m.role === 'USER' && index === history.length - 1 && Boolean(body.selectedImage);
      if (isLatestUser && body.selectedImage) {
        return {
          role,
          content: [
            { type: 'image_url' as const, image_url: { url: body.selectedImage } },
            { type: 'text' as const, text: m.text },
          ],
        };
      }
      return { role, content: m.text };
    }),
  ];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let fullResponse = '';

  try {
    for await (const event of streamTutorWithTools(messages)) {
      if (event.type === 'text') {
        fullResponse += event.text;
        res.write(`data: ${JSON.stringify({ text: event.text })}\n\n`);
      } else if (event.type === 'graph') {
        const block = serializeGraphBlock(event.graph);
        fullResponse += block;
        res.write(`data: ${JSON.stringify({ graph: event.graph })}\n\n`);
      }
    }

    await prisma.chatMessage.create({
      data: { sessionId, role: 'ASSISTANT', text: fullResponse },
    });

    res.write(`data: ${JSON.stringify({ sessionId })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
    res.end();
    throw error;
  }
}
