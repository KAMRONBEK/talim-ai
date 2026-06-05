import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getParam } from '../lib/params.js';
import { resolveLocale } from '../lib/locale.js';
import { podcastQueue } from '../services/queue.service.js';
import { storageService } from '../services/storage.service.js';

const createPodcastSchema = z.object({
  locale: z.enum(['uz', 'en', 'ru']).optional(),
});

function formatEpisode(episode: {
  id: string;
  podcastId: string;
  title: string;
  order: number;
  audioPath: string | null;
  durationSec: number | null;
  sectionId: string | null;
}) {
  return {
    id: episode.id,
    podcastId: episode.podcastId,
    title: episode.title,
    order: episode.order,
    hasAudio: !!episode.audioPath,
    durationSec: episode.durationSec,
    sectionId: episode.sectionId,
  };
}

async function assertContentReady(userId: string, contentId: string) {
  const content = await prisma.content.findFirst({
    where: { id: contentId, userId, status: 'READY' },
  });
  if (!content) throw new AppError(404, 'Content not found or not ready');
  return content;
}

export async function getPodcast(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const locale = resolveLocale(req);
  await assertContentReady(req.user.userId, contentId);

  const podcast = await prisma.podcast.findUnique({
    where: { contentId_locale: { contentId, locale } },
    include: { episodes: { orderBy: { order: 'asc' } } },
  });

  if (!podcast) {
    res.json({ podcast: null });
    return;
  }

  res.json({
    podcast: {
      id: podcast.id,
      contentId: podcast.contentId,
      locale: podcast.locale,
      status: podcast.status,
      episodes: podcast.episodes.map(formatEpisode),
    },
  });
}

export async function createPodcast(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const body = createPodcastSchema.parse(req.body ?? {});
  const locale = body.locale ?? resolveLocale(req);
  await assertContentReady(req.user.userId, contentId);

  const existing = await prisma.podcast.findUnique({
    where: { contentId_locale: { contentId, locale } },
  });

  if (existing?.status === 'GENERATING') {
    throw new AppError(409, 'Podcast generation already in progress');
  }
  if (existing?.status === 'READY') {
    res.json({
      podcast: {
        id: existing.id,
        contentId: existing.contentId,
        locale: existing.locale,
        status: existing.status,
      },
    });
    return;
  }

  const podcast =
    existing ??
    (await prisma.podcast.create({
      data: { contentId, locale, status: 'PENDING' },
    }));

  if (existing && existing.status === 'FAILED') {
    const episodes = await prisma.podcastEpisode.findMany({
      where: { podcastId: existing.id },
    });
    await Promise.all(
      episodes
        .filter((e) => e.audioPath)
        .map((e) => storageService.delete(e.audioPath!)),
    );
    await prisma.podcastEpisode.deleteMany({ where: { podcastId: existing.id } });
    await prisma.podcast.update({
      where: { id: existing.id },
      data: { status: 'PENDING' },
    });
  }

  await podcastQueue.add({ contentId, podcastId: podcast.id, locale });
  await prisma.podcast.update({
    where: { id: podcast.id },
    data: { status: 'GENERATING' },
  });

  res.status(202).json({
    podcast: { id: podcast.id, contentId, locale, status: 'GENERATING' },
  });
}

export async function streamEpisodeAudio(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const episodeId = getParam(req, 'episodeId');
  await assertContentReady(req.user.userId, contentId);

  const episode = await prisma.podcastEpisode.findFirst({
    where: {
      id: episodeId,
      podcast: { contentId },
    },
  });

  if (!episode?.audioPath) throw new AppError(404, 'Audio not found');

  const buffer = await storageService.get(episode.audioPath);
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
}
