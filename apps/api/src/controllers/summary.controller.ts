import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getOrderedChunks, buildRagContext, boundContextByTokens } from '../services/rag.service.js';
import {
  generateChatCompletion,
  streamChatCompletion,
  type ChatMessageInput,
} from '../services/ai.service.js';
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
import { sseHeaders, sseData, sseDone } from '../lib/sse.js';

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

/**
 * Builds the RAG context + prompt messages shared by the sync and streaming
 * summary paths. Throws a clean AppError(400) when there is no source text —
 * callers invoke this BEFORE flushing SSE headers so the error stays JSON.
 */
async function buildSummaryMessages(
  contentId: string,
  title: string,
  locale: AppLocale,
  sectionId?: string,
): Promise<ChatMessageInput[]> {
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

  return [
    { role: 'system', content: getSummarySystemPrompt(locale) },
    { role: 'user', content: buildSummaryUserPrompt(locale, title, context) },
  ];
}

async function generateSummaryText(
  userId: string,
  contentId: string,
  title: string,
  locale: AppLocale,
  sectionId?: string,
): Promise<string> {
  const messages = await buildSummaryMessages(contentId, title, locale, sectionId);

  const raw = await generateChatCompletion(messages, {
    userId,
    feature: 'SUMMARY_GEN',
    metadata: { contentId, sectionId },
  });

  return sanitizeSummaryOutput(locale, raw);
}

/**
 * Persist a freshly-generated summary and record the learning-activity day. Shared by the
 * sync (`generateSummary`) and streaming (`streamSummary`) paths so their write contract
 * (composite key, sectionId handling, activity attribution) can't drift. The cached
 * branches of both paths intentionally skip this (no new activity on a re-open).
 */
async function persistAndRecordSummary(params: {
  ownerUserId: string;
  actorUserId: string;
  contentId: string;
  key: string;
  sectionId?: string;
  locale: AppLocale;
  summary: string;
}) {
  const saved = await prisma.contentSummary.upsert({
    where: {
      userId_contentId_scopeKey_locale: {
        userId: params.ownerUserId,
        contentId: params.contentId,
        scopeKey: params.key,
        locale: params.locale,
      },
    },
    create: {
      userId: params.ownerUserId,
      contentId: params.contentId,
      scopeKey: params.key,
      sectionId: params.sectionId ?? null,
      locale: params.locale,
      summary: params.summary,
    },
    update: {
      summary: params.summary,
    },
  });
  await recordLearningActivity(params.actorUserId);
  return saved;
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

  const saved = await persistAndRecordSummary({
    ownerUserId,
    actorUserId: req.user.userId,
    contentId,
    key,
    sectionId: body.sectionId,
    locale,
    summary: summaryText,
  });

  res.json({ summary: formatSummary(saved), cached: false });
}

/**
 * SSE variant of generateSummary — same guards/contract (scope/sectionId/locale),
 * but the DeepSeek completion is streamed token-by-token as `data: {"text": ...}`
 * frames (chat transport pattern) instead of blocking 8-40s. On completion the
 * summary is persisted exactly like the sync path, then a final
 * `data: {"summary": <persisted summary>}` frame and `data: [DONE]` are sent.
 * All access/quota/context errors are raised BEFORE headers flush so they stay
 * clean JSON; mid-stream failures emit `data: {"error": ...}` without [DONE].
 */
export async function streamSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
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
    // Cached — short-circuit over the same SSE framing so the client keeps one parser.
    sseHeaders(res);
    sseData(res, { summary: formatSummary(existing) });
    sseDone(res);
    res.end();
    return;
  }

  await assertQuota(req.user.userId, 'GENERATION', {
    role: req.user.role,
    tenantId: req.user.tenantId,
  });

  // Context/prompt build can 400 (no source text) — keep it before the flush.
  const messages = await buildSummaryMessages(contentId, content.title, locale, body.sectionId);

  sseHeaders(res);

  try {
    let raw = '';
    for await (const text of streamChatCompletion(messages, {
      userId: ownerUserId,
      feature: 'SUMMARY_GEN',
      metadata: { contentId, sectionId: body.sectionId },
    })) {
      raw += text;
      sseData(res, { text });
    }

    const saved = await persistAndRecordSummary({
      ownerUserId,
      actorUserId: req.user.userId,
      contentId,
      key,
      sectionId: body.sectionId,
      locale,
      summary: sanitizeSummaryOutput(locale, raw),
    });

    sseData(res, { summary: formatSummary(saved) });
    sseDone(res);
    res.end();
  } catch (error) {
    sseData(res, { error: 'Stream failed' });
    res.end();
    console.error('Summary stream failed:', error);
  }
}
