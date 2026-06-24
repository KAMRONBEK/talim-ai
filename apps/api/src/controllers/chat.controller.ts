import type { Response } from 'express';
import type { AppLocale } from '@talim/types';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  searchSimilarChunks,
  searchSimilarFigures,
  mergeSimilarChunks,
  buildRagContext,
  buildFigureContext,
} from '../services/rag.service.js';
import { streamTutorWithTools } from '../services/ai.service.js';
import { serializeBlockForMessage } from '../lib/tutor-tools.js';
import { buildTutorSystemMessage } from '../lib/locale-prompts.js';
import { detectTutorGraphIntent } from '../lib/tutor-graph-intent.js';
import {
  classifyTutorScope,
  getClarificationResponse,
  getOutOfScopeResponse,
  isTutorScopeRefusal,
} from '../lib/tutor-scope.js';
import { getParam } from '../lib/params.js';
import { resolveLocale } from '../lib/locale.js';
import { manimQueue } from '../services/queue.service.js';
import { resolveManimAsset } from '../jobs/renderManim.job.js';
import { storageService } from '../services/storage.service.js';
import { assertCanAccessContent } from '../services/contentAccess.service.js';

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

function mapChatMessage(m: {
  id: string;
  sessionId: string;
  role: string;
  text: string;
  excerpt: string | null;
  excerptImage: string | null;
  createdAt: Date;
}) {
  return {
    id: m.id,
    sessionId: m.sessionId,
    role: m.role,
    text: m.text,
    excerpt: m.excerpt,
    excerptImage: m.excerptImage,
    createdAt: m.createdAt.toISOString(),
  };
}

async function streamStaticAssistantResponse(
  res: Response,
  sessionId: string,
  text: string,
): Promise<void> {
  await prisma.chatMessage.create({
    data: { sessionId, role: 'ASSISTANT', text },
  });

  res.write(`data: ${JSON.stringify({ text })}\n\n`);
  res.write(`data: ${JSON.stringify({ sessionId })}\n\n`);
  res.write('data: [DONE]\n\n');
  res.end();
}

export async function getContentChat(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'contentId');
  const locale = resolveLocale(req) as AppLocale;

  await assertCanAccessContent(req.user, contentId, { requireReady: true });

  const session = await prisma.chatSession.findFirst({
    where: { userId: req.user.userId, contentId, locale },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  if (!session) {
    res.json({ sessionId: null, messages: [] });
    return;
  }

  res.json({
    sessionId: session.id,
    messages: session.messages.map(mapChatMessage),
  });
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
    messages: session.messages.map(mapChatMessage),
  });
}

export async function getManimAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const jobId = getParam(req, 'jobId');
  const asset = await resolveManimAsset(jobId);
  if (!asset) throw new AppError(404, 'Asset not found');

  // Authorize: the asset belongs to a chat message; only its owner may fetch it.
  const message = await prisma.chatMessage.findFirst({
    where: { id: asset.messageId, session: { userId: req.user.userId } },
    select: { id: true },
  });
  if (!message) throw new AppError(404, 'Asset not found');

  const buffer = await storageService.get(asset.storagePath);
  const ext = asset.storagePath.split('.').pop()?.toLowerCase();
  const contentType =
    ext === 'mp4' ? 'video/mp4' : ext === 'svg' ? 'image/svg+xml' : 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.send(buffer);
}

export async function streamChat(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const body = streamSchema.parse(req.body);

  const content = await assertCanAccessContent(req.user, body.contentId, { requireReady: true });

  const locale = (body.locale ?? resolveLocale(req)) as AppLocale;

  const sessionId = await getOrCreateSession(
    req.user.userId,
    body.contentId,
    locale,
    body.sessionId,
  );

  await prisma.chatMessage.create({
    data: {
      sessionId,
      role: 'USER',
      text: body.message,
      excerpt: body.selectedExcerpt?.trim() || null,
      excerptImage: body.selectedImage || null,
    },
  });

  const history = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  const embedUsage = {
    userId: req.user.userId,
    metadata: { contentId: body.contentId, sessionId },
  };
  const messageChunks = await searchSimilarChunks(body.contentId, body.message, 7, embedUsage);
  const excerptChunks =
    !body.selectedImage && body.selectedExcerpt?.trim()
      ? await searchSimilarChunks(body.contentId, body.selectedExcerpt, 7, embedUsage)
      : [];
  const chunks = excerptChunks.length
    ? mergeSimilarChunks(excerptChunks, messageChunks)
    : messageChunks;
  // Pull relevant captioned figures so the tutor can reason about diagrams/charts.
  const figures = await searchSimilarFigures(body.contentId, body.message, 3, embedUsage);
  const baseContext = buildRagContext(chunks, locale);
  const figureContext = buildFigureContext(figures, locale);
  const context = figureContext ? `${baseContext}\n\n${figureContext}` : baseContext;
  const scopeDecision = await classifyTutorScope({
    locale,
    contentTitle: content.title,
    message: body.message,
    context,
    selectedExcerpt: body.selectedExcerpt,
    hasSelectedImage: Boolean(body.selectedImage),
  });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  if (scopeDecision.route === 'unrelated') {
    await streamStaticAssistantResponse(res, sessionId, getOutOfScopeResponse(locale));
    return;
  }

  if (scopeDecision.route === 'needs_clarification') {
    await streamStaticAssistantResponse(res, sessionId, getClarificationResponse(locale));
    return;
  }

  const filteredHistory = history.filter(
    (m) => !(m.role === 'ASSISTANT' && isTutorScopeRefusal(locale, m.text)),
  );
  const graphIntent = detectTutorGraphIntent({
    message: body.message,
    selectedExcerpt: body.selectedExcerpt,
    hasSelectedImage: Boolean(body.selectedImage),
  });

  const messages = [
    {
      role: 'system' as const,
      content: buildTutorSystemMessage(
        locale,
        context,
        body.selectedExcerpt,
        Boolean(body.selectedImage),
        scopeDecision.scopeNote,
      ),
    },
    ...filteredHistory.map((m, index) => {
      const role = (m.role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant';
      const isLatestUser =
        m.role === 'USER' && index === filteredHistory.length - 1 && Boolean(body.selectedImage);
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

  let fullResponse = '';
  const manimJobs: Array<{ jobId: string; script: string }> = [];

  try {
    for await (const event of streamTutorWithTools(messages, {
      graphIntent,
      usage: {
        userId: req.user.userId,
        feature: 'TUTOR_CHAT',
        metadata: { contentId: body.contentId, sessionId },
      },
    })) {
      if (event.type === 'text') {
        fullResponse += event.text;
        res.write(`data: ${JSON.stringify({ text: event.text })}\n\n`);
      } else if (event.type === 'visual') {
        const blockStr = serializeBlockForMessage(event.block);
        fullResponse += blockStr;
        res.write(`data: ${JSON.stringify({ visual: event.block })}\n\n`);
        if (event.block.kind === 'desmos') {
          res.write(`data: ${JSON.stringify({ graph: event.block.payload })}\n\n`);
        }
      } else if (event.type === 'manim_enqueue') {
        manimJobs.push({ jobId: event.jobId, script: event.script });
      }
    }

    const assistantMessage = await prisma.chatMessage.create({
      data: { sessionId, role: 'ASSISTANT', text: fullResponse },
    });

    for (const job of manimJobs) {
      await manimQueue.add({
        jobId: job.jobId,
        script: job.script,
        messageId: assistantMessage.id,
      });
    }

    res.write(`data: ${JSON.stringify({ sessionId })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
    res.end();
    console.error('Chat stream failed:', error);
  }
}
