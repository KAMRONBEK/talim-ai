import type { Response } from 'express';
import { z } from 'zod';
import type { VideoSegment } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getParam } from '../lib/params.js';
import { resolveLocale } from '../lib/locale.js';
import { assertQuota } from '../services/subscription.service.js';
import { assertCanAccessContent, assertCanGenerate } from '../services/contentAccess.service.js';
import { storageService } from '../services/storage.service.js';
import { videoQueue } from '../services/queue.service.js';

const videoBodySchema = z.object({
  sectionId: z.string().optional(),
  locale: z.enum(['uz', 'en', 'ru']).optional(),
  regenerate: z.boolean().optional(),
});

function scopeKey(sectionId?: string): string {
  return sectionId ?? 'full';
}

interface StoredSegment {
  index: number;
  title: string;
  narration: string;
  audioPath: string | null;
  durationSec: number;
}

function parseSegments(raw: unknown): StoredSegment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .map((s) => ({
      index: typeof s.index === 'number' ? s.index : 0,
      title: typeof s.title === 'string' ? s.title : '',
      narration: typeof s.narration === 'string' ? s.narration : '',
      audioPath: typeof s.audioPath === 'string' ? s.audioPath : null,
      durationSec: typeof s.durationSec === 'number' ? s.durationSec : 0,
    }));
}

/** Client-facing segments hide the storage path and expose a `hasAudio` flag. */
function publicSegments(raw: unknown): VideoSegment[] | null {
  if (!Array.isArray(raw)) return null;
  return parseSegments(raw).map((s) => ({
    index: s.index,
    title: s.title,
    narration: s.narration,
    hasAudio: Boolean(s.audioPath),
    durationSec: s.durationSec,
  }));
}

function formatVideo(row: {
  id: string;
  contentId: string;
  sectionId: string | null;
  scopeKey: string;
  locale: string;
  status: string;
  script: string | null;
  storagePath: string | null;
  durationSec: number | null;
  segments: unknown;
  createdAt: Date;
}) {
  return {
    id: row.id,
    contentId: row.contentId,
    sectionId: row.sectionId,
    scopeKey: row.scopeKey,
    locale: row.locale,
    status: row.status,
    script: row.script,
    storagePath: row.storagePath,
    durationSec: row.durationSec,
    segments: publicSegments(row.segments),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getVideo(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const sectionId = typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined;
  const locale = resolveLocale(req);
  await assertCanAccessContent(req.user, contentId, { requireReady: true });

  const video = await prisma.contentVideo.findUnique({
    where: {
      contentId_locale_scopeKey: { contentId, locale, scopeKey: scopeKey(sectionId) },
    },
  });

  res.json({ video: video ? formatVideo(video) : null });
}

export async function createVideo(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  assertCanGenerate(req.user);
  const contentId = getParam(req, 'id');
  const body = videoBodySchema.parse(req.body ?? {});
  const locale = body.locale ?? resolveLocale(req);
  await assertCanAccessContent(req.user, contentId, { requireReady: true });

  const key = scopeKey(body.sectionId);

  const existing = await prisma.contentVideo.findUnique({
    where: { contentId_locale_scopeKey: { contentId, locale, scopeKey: key } },
  });

  // A ready/in-progress video is reused unless the caller explicitly regenerates.
  if (existing && existing.status !== 'FAILED' && !body.regenerate) {
    res.json({ video: formatVideo(existing), cached: true });
    return;
  }

  // Quota: a video draws on the monthly generation budget AND its own video cap.
  await assertQuota(req.user.userId, 'GENERATION', {
    role: req.user.role,
    tenantId: req.user.tenantId,
  });
  await assertQuota(req.user.userId, 'VIDEO', {
    role: req.user.role,
    tenantId: req.user.tenantId,
  });

  const video = existing
    ? await prisma.contentVideo.update({
        where: { id: existing.id },
        data: { status: 'GENERATING', script: null, durationSec: null, segments: undefined },
      })
    : await prisma.contentVideo.create({
        data: {
          contentId,
          locale,
          scopeKey: key,
          sectionId: body.sectionId ?? null,
          status: 'GENERATING',
        },
      });

  await videoQueue.add({ contentId, videoId: video.id, locale });

  res.status(202).json({ video: formatVideo(video), cached: false });
}

export async function streamVideoSegmentAudio(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const index = Number.parseInt(getParam(req, 'index'), 10);
  const sectionId = typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined;
  const locale = resolveLocale(req);
  await assertCanAccessContent(req.user, contentId, { requireReady: true });

  const video = await prisma.contentVideo.findUnique({
    where: {
      contentId_locale_scopeKey: { contentId, locale, scopeKey: scopeKey(sectionId) },
    },
  });
  if (!video) throw new AppError(404, 'Video not found');

  const segment = parseSegments(video.segments).find((s) => s.index === index);
  if (!segment?.audioPath) throw new AppError(404, 'Segment audio not found');

  const buffer = await storageService.get(segment.audioPath);
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
}
