import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { searchSimilarChunks, buildRagContext } from '../services/rag.service.js';
import { streamChatCompletion } from '../services/ai.service.js';
import { getParam } from '../lib/params.js';

const streamSchema = z.object({
  contentId: z.string().min(1),
  message: z.string().min(1),
  sessionId: z.string().optional(),
  selectedExcerpt: z.string().max(4000).optional(),
});

export async function getOrCreateSession(
  userId: string,
  contentId: string,
  sessionId?: string,
): Promise<string> {
  if (sessionId) {
    const existing = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId, contentId },
    });
    if (existing) return existing.id;
  }

  const session = await prisma.chatSession.create({
    data: { userId, contentId },
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

  const sessionId = await getOrCreateSession(req.user.userId, body.contentId, body.sessionId);

  await prisma.chatMessage.create({
    data: { sessionId, role: 'USER', text: body.message },
  });

  const history = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  const chunks = await searchSimilarChunks(body.contentId, body.message);
  const context = buildRagContext(chunks);
  const excerptBlock = body.selectedExcerpt
    ? `\n\nUser selected this excerpt from the material:\n"""${body.selectedExcerpt}"""`
    : '';

  const messages = [
    {
      role: 'system' as const,
      content: `You are Talim AI, an AI tutor. Answer based on the provided content context. If the answer is not in the context, say so honestly.\n\nContext:\n${context}${excerptBlock}`,
    },
    ...history.map((m) => ({
      role: (m.role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.text,
    })),
  ];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let fullResponse = '';

  try {
    for await (const text of streamChatCompletion(messages)) {
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
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
