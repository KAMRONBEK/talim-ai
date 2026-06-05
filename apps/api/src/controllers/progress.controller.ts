import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getParam } from '../lib/params.js';
import {
  markSectionViewed,
  computeStreakDays,
} from '../services/learningProgress.service.js';
import { resolveLocale } from '../lib/locale.js';

const patchProgressSchema = z.object({
  sectionId: z.string().min(1),
});

function formatSectionProgress(row: {
  sectionId: string;
  contentId: string;
  coverageScore: number;
  quizBestScore: number | null;
  quickCheckAccuracy: number | null;
  viewedAt: Date | null;
  aiFeedback: string | null;
}) {
  return {
    sectionId: row.sectionId,
    contentId: row.contentId,
    coverageScore: row.coverageScore,
    quizBestScore: row.quizBestScore,
    quickCheckAccuracy: row.quickCheckAccuracy,
    viewedAt: row.viewedAt?.toISOString() ?? null,
    aiFeedback: row.aiFeedback,
  };
}

async function assertContentAccess(userId: string, contentId: string) {
  const content = await prisma.content.findFirst({
    where: { id: contentId, userId, status: 'READY' },
  });
  if (!content) throw new AppError(404, 'Content not found or not ready');
  return content;
}

export async function getContentProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  await assertContentAccess(req.user.userId, contentId);

  const [contentProgress, sectionRows] = await Promise.all([
    prisma.contentProgress.findUnique({
      where: { userId_contentId: { userId: req.user.userId, contentId } },
    }),
    prisma.sectionProgress.findMany({
      where: { userId: req.user.userId, contentId },
    }),
  ]);

  const sections: Record<string, ReturnType<typeof formatSectionProgress>> = {};
  for (const row of sectionRows) {
    sections[row.sectionId] = formatSectionProgress(row);
  }

  res.json({
    contentProgress: contentProgress
      ? {
          contentId: contentProgress.contentId,
          lastSectionId: contentProgress.lastSectionId,
          overallCoverage: contentProgress.overallCoverage,
          lastActivityAt: contentProgress.lastActivityAt.toISOString(),
        }
      : null,
    sections,
  });
}

export async function patchContentProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const body = patchProgressSchema.parse(req.body);
  await assertContentAccess(req.user.userId, contentId);

  await markSectionViewed(req.user.userId, contentId, body.sectionId);

  const [contentProgress, sectionRow] = await Promise.all([
    prisma.contentProgress.findUnique({
      where: { userId_contentId: { userId: req.user.userId, contentId } },
    }),
    prisma.sectionProgress.findUnique({
      where: {
        userId_sectionId: { userId: req.user.userId, sectionId: body.sectionId },
      },
    }),
  ]);

  res.json({
    contentProgress: contentProgress
      ? {
          contentId: contentProgress.contentId,
          lastSectionId: contentProgress.lastSectionId,
          overallCoverage: contentProgress.overallCoverage,
          lastActivityAt: contentProgress.lastActivityAt.toISOString(),
        }
      : null,
    sectionProgress: sectionRow ? formatSectionProgress(sectionRow) : null,
  });
}

export async function getLearningHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const locale = resolveLocale(req);
  await assertContentAccess(req.user.userId, contentId);
  const userId = req.user.userId;

  const [quizzes, summaries, podcast, streakDays] = await Promise.all([
    prisma.quiz.findMany({
      where: { contentId, userId, locale },
      include: {
        questions: { select: { id: true } },
        attempts: {
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contentSummary.findMany({
      where: { contentId, userId, locale },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.podcast.findUnique({ where: { contentId_locale: { contentId, locale } } }),
    computeStreakDays(userId),
  ]);

  res.json({
    quizzes: quizzes.map((q) => ({
      id: q.id,
      contentId: q.contentId,
      userId: q.userId,
      sectionId: q.sectionId,
      kind: q.kind,
      locale: q.locale,
      createdAt: q.createdAt.toISOString(),
      questionCount: q.questions.length,
      latestAttempt: q.attempts[0]
        ? {
            id: q.attempts[0].id,
            quizId: q.attempts[0].quizId,
            userId: q.attempts[0].userId,
            score: q.attempts[0].score,
            answers: q.attempts[0].answers as Record<string, string>,
            createdAt: q.attempts[0].createdAt.toISOString(),
          }
        : null,
    })),
    summaries: summaries.map((s) => ({
      id: s.id,
      contentId: s.contentId,
      sectionId: s.sectionId,
      scopeKey: s.scopeKey,
      locale: s.locale,
      summary: s.summary,
      createdAt: s.createdAt.toISOString(),
    })),
    podcastStatus: podcast?.status ?? null,
    streakDays,
  });
}

const episodeProgressSchema = z.object({
  listenedSec: z.number().int().min(0),
  completed: z.boolean().optional(),
});

export async function patchEpisodeProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const episodeId = getParam(req, 'episodeId');
  const body = episodeProgressSchema.parse(req.body);
  await assertContentAccess(req.user.userId, contentId);

  const episode = await prisma.podcastEpisode.findFirst({
    where: { id: episodeId, podcast: { contentId } },
  });
  if (!episode) throw new AppError(404, 'Episode not found');

  const progress = await prisma.podcastEpisodeProgress.upsert({
    where: {
      userId_episodeId: { userId: req.user.userId, episodeId },
    },
    create: {
      userId: req.user.userId,
      episodeId,
      listenedSec: body.listenedSec,
      completed: body.completed ?? false,
    },
    update: {
      listenedSec: body.listenedSec,
      ...(body.completed !== undefined ? { completed: body.completed } : {}),
    },
  });

  res.json({
    progress: {
      episodeId: progress.episodeId,
      listenedSec: progress.listenedSec,
      completed: progress.completed,
    },
  });
}

export async function getEpisodeProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const locale = resolveLocale(req);
  await assertContentAccess(req.user.userId, contentId);

  const podcast = await prisma.podcast.findUnique({
    where: { contentId_locale: { contentId, locale } },
    include: { episodes: { select: { id: true } } },
  });

  if (!podcast) {
    res.json({ progress: [] });
    return;
  }

  const episodeIds = podcast.episodes.map((e) => e.id);
  const rows = await prisma.podcastEpisodeProgress.findMany({
    where: {
      userId: req.user.userId,
      episodeId: { in: episodeIds },
    },
  });

  res.json({
    progress: rows.map((r) => ({
      episodeId: r.episodeId,
      listenedSec: r.listenedSec,
      completed: r.completed,
    })),
  });
}
