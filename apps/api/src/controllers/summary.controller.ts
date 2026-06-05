import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getOrderedChunks, buildRagContext } from '../services/rag.service.js';
import { generateChatCompletion } from '../services/ai.service.js';
import {
  buildSummaryUserPrompt,
  sanitizeSummaryOutput,
  SUMMARY_SYSTEM_PROMPT,
} from '../lib/summary-prompt.js';
import { getParam } from '../lib/params.js';
import { getSectionBody } from '../services/section.service.js';
import { recordLearningActivity } from '../services/learningProgress.service.js';

const summaryBodySchema = z.object({
  sectionId: z.string().optional(),
});

function scopeKey(sectionId?: string): string {
  return sectionId ?? 'full';
}

async function assertContentReady(userId: string, contentId: string) {
  const content = await prisma.content.findFirst({
    where: { id: contentId, userId, status: 'READY' },
  });
  if (!content) throw new AppError(404, 'Content not found or not ready');
  return content;
}

async function generateSummaryText(
  contentId: string,
  title: string,
  sectionId?: string,
): Promise<string> {
  let context: string;

  if (sectionId) {
    const body = await getSectionBody(contentId, sectionId);
    if (!body.trim()) throw new AppError(400, 'No section text available for summary');
    context = body.slice(0, 12000);
  } else {
    const chunks = await getOrderedChunks(contentId);
    if (chunks.length === 0) {
      throw new AppError(400, 'No content text available for summary');
    }
    context = buildRagContext(chunks);
  }

  const raw = await generateChatCompletion([
    { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
    { role: 'user', content: buildSummaryUserPrompt(title, context) },
  ]);

  return sanitizeSummaryOutput(raw);
}

function formatSummary(row: {
  id: string;
  contentId: string;
  sectionId: string | null;
  scopeKey: string;
  summary: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    contentId: row.contentId,
    sectionId: row.sectionId,
    scopeKey: row.scopeKey,
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'contentId');
  const sectionId = typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined;
  await assertContentReady(req.user.userId, contentId);

  const saved = await prisma.contentSummary.findUnique({
    where: {
      userId_contentId_scopeKey: {
        userId: req.user.userId,
        contentId,
        scopeKey: scopeKey(sectionId),
      },
    },
  });

  if (!saved) {
    throw new AppError(404, 'Summary not found');
  }

  res.json({ summary: formatSummary(saved) });
}

export async function generateSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'contentId');
  const body = summaryBodySchema.parse(req.body ?? {});
  const content = await assertContentReady(req.user.userId, contentId);
  const key = scopeKey(body.sectionId);

  const existing = await prisma.contentSummary.findUnique({
    where: {
      userId_contentId_scopeKey: {
        userId: req.user.userId,
        contentId,
        scopeKey: key,
      },
    },
  });

  if (existing) {
    res.json({ summary: formatSummary(existing), cached: true });
    return;
  }

  const summaryText = await generateSummaryText(contentId, content.title, body.sectionId);

  const saved = await prisma.contentSummary.upsert({
    where: {
      userId_contentId_scopeKey: {
        userId: req.user.userId,
        contentId,
        scopeKey: key,
      },
    },
    create: {
      userId: req.user.userId,
      contentId,
      scopeKey: key,
      sectionId: body.sectionId ?? null,
      summary: summaryText,
    },
    update: {
      summary: summaryText,
    },
  });

  await recordLearningActivity(req.user.userId);

  res.json({ summary: formatSummary(saved), cached: false });
}
