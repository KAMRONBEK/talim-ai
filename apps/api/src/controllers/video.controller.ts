import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getParam } from '../lib/params.js';
import { resolveLocale } from '../lib/locale.js';
import { assertQuota } from '../services/subscription.service.js';

const videoBodySchema = z.object({
  sectionId: z.string().optional(),
  locale: z.enum(['uz', 'en', 'ru']).optional(),
});

function scopeKey(sectionId?: string): string {
  return sectionId ?? 'full';
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
    createdAt: row.createdAt.toISOString(),
  };
}

async function assertContentReady(userId: string, contentId: string) {
  const content = await prisma.content.findFirst({
    where: { id: contentId, userId, status: 'READY' },
  });
  if (!content) throw new AppError(404, 'Content not found or not ready');
  return content;
}

export async function getVideo(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const sectionId = typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined;
  const locale = resolveLocale(req);
  await assertContentReady(req.user.userId, contentId);

  const video = await prisma.contentVideo.findUnique({
    where: {
      contentId_locale_scopeKey: {
        contentId,
        locale,
        scopeKey: scopeKey(sectionId),
      },
    },
  });

  res.json({ video: video ? formatVideo(video) : null });
}

export async function createVideo(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const body = videoBodySchema.parse(req.body ?? {});
  const locale = body.locale ?? resolveLocale(req);
  await assertContentReady(req.user.userId, contentId);

  const key = scopeKey(body.sectionId);

  const existing = await prisma.contentVideo.findUnique({
    where: {
      contentId_locale_scopeKey: {
        contentId,
        locale,
        scopeKey: key,
      },
    },
  });

  if (existing) {
    res.json({ video: formatVideo(existing), cached: true });
    return;
  }

  await assertQuota(req.user.userId, 'GENERATION', { role: req.user.role });

  const video = await prisma.contentVideo.create({
    data: {
      contentId,
      locale,
      scopeKey: key,
      sectionId: body.sectionId ?? null,
      status: 'PENDING',
    },
  });

  res.status(501).json({
    video: formatVideo(video),
    cached: false,
    message: 'Video generation is not yet implemented',
  });
}
