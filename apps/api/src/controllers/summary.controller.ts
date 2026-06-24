import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getOrderedChunks, buildRagContext, boundContextByTokens } from '../services/rag.service.js';
import { generateChatCompletion } from '../services/ai.service.js';
import {
  getSummarySystemPrompt,
  buildSummaryUserPrompt,
  sanitizeSummaryOutput,
} from '../lib/locale-prompts.js';
import { getParam } from '../lib/params.js';
import { resolveLocale } from '../lib/locale.js';
import { getSectionBody } from '../services/section.service.js';
import { recordLearningActivity } from '../services/learningProgress.service.js';
import type { AppLocale } from '@talim/types';
import { assertQuota } from '../services/subscription.service.js';
import { assertCanAccessContent, assertCanGenerate } from '../services/contentAccess.service.js';

const summaryBodySchema = z.object({
  sectionId: z.string().optional(),
  locale: z.enum(['uz', 'en', 'ru']).optional(),
});

function scopeKey(sectionId?: string): string {
  return sectionId ?? 'full';
}

function summaryUserId(
  user: NonNullable<AuthenticatedRequest['user']>,
  content: { userId: string },
): string {
  if (user.role === 'TENANT_LEARNER') return content.userId;
  return user.userId;
}

async function generateSummaryText(
  userId: string,
  contentId: string,
  title: string,
  locale: AppLocale,
  sectionId?: string,
): Promise<string> {
  let context: string;

  if (sectionId) {
    const body = await getSectionBody(contentId, sectionId);
    if (!body.trim()) throw new AppError(400, 'No section text available for summary');
    context = boundContextByTokens(body, 8000);
  } else {
    const chunks = await getOrderedChunks(contentId);
    if (chunks.length === 0) {
      throw new AppError(400, 'No content text available for summary');
    }
    // Whole-document summary now sees the full material (token-bounded), not 40 chunks.
    context = boundContextByTokens(buildRagContext(chunks), 12000);
  }

  const raw = await generateChatCompletion(
    [
      { role: 'system', content: getSummarySystemPrompt(locale) },
      { role: 'user', content: buildSummaryUserPrompt(locale, title, context) },
    ],
    {
      userId,
      feature: 'SUMMARY_GEN',
      metadata: { contentId, sectionId },
    },
  );

  return sanitizeSummaryOutput(locale, raw);
}

function formatSummary(row: {
  id: string;
  contentId: string;
  sectionId: string | null;
  scopeKey: string;
  locale: string;
  summary: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    contentId: row.contentId,
    sectionId: row.sectionId,
    scopeKey: row.scopeKey,
    locale: row.locale,
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'contentId');
  const sectionId = typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined;
  const locale = resolveLocale(req);
  const content = await assertCanAccessContent(req.user, contentId, { requireReady: true });
  const ownerUserId = summaryUserId(req.user, content);

  const saved = await prisma.contentSummary.findUnique({
    where: {
      userId_contentId_scopeKey_locale: {
        userId: ownerUserId,
        contentId,
        scopeKey: scopeKey(sectionId),
        locale,
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
  assertCanGenerate(req.user);
  const contentId = getParam(req, 'contentId');
  const body = summaryBodySchema.parse(req.body ?? {});
  const locale = body.locale ?? resolveLocale(req);
  const content = await assertCanAccessContent(req.user, contentId, { requireReady: true });
  const ownerUserId = summaryUserId(req.user, content);
  const key = scopeKey(body.sectionId);

  const existing = await prisma.contentSummary.findUnique({
    where: {
      userId_contentId_scopeKey_locale: {
        userId: ownerUserId,
        contentId,
        scopeKey: key,
        locale,
      },
    },
  });

  if (existing) {
    res.json({ summary: formatSummary(existing), cached: true });
    return;
  }

  await assertQuota(req.user.userId, 'GENERATION', {
    role: req.user.role,
    tenantId: req.user.tenantId,
  });

  const summaryText = await generateSummaryText(
    ownerUserId,
    contentId,
    content.title,
    locale,
    body.sectionId,
  );

  const saved = await prisma.contentSummary.upsert({
    where: {
      userId_contentId_scopeKey_locale: {
        userId: ownerUserId,
        contentId,
        scopeKey: key,
        locale,
      },
    },
    create: {
      userId: ownerUserId,
      contentId,
      scopeKey: key,
      sectionId: body.sectionId ?? null,
      locale,
      summary: summaryText,
    },
    update: {
      summary: summaryText,
    },
  });

  await recordLearningActivity(req.user.userId);

  res.json({ summary: formatSummary(saved), cached: false });
}
