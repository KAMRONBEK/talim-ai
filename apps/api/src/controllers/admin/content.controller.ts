import type { Response } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { getParam } from '../../lib/params.js';
import { writeAdminAuditLog } from '../../services/admin/audit.service.js';
import { contentQueue } from '../../services/queue.service.js';
import { cancelContentJobs } from '../../services/queue.service.js';
import { storageService } from '../../services/storage.service.js';
import { getChunkSample } from '../../services/admin/analytics.service.js';
import { paginationSchema } from './shared.js';

export async function listContents(req: AuthenticatedRequest, res: Response): Promise<void> {
  const query = paginationSchema.parse(req.query);
  const skip = (query.page - 1) * query.pageSize;
  const where: Prisma.ContentWhereInput = query.search?.trim()
    ? { title: { contains: query.search.trim(), mode: 'insensitive' } }
    : {};

  const [total, contents] = await Promise.all([
    prisma.content.count({ where }),
    prisma.content.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  res.json({
    items: contents.map((c) => ({
      id: c.id,
      userId: c.userId,
      userEmail: c.user.email,
      userName: c.user.name,
      type: c.type,
      title: c.title,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
  });
}

export async function deleteContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const id = getParam(req, 'id');
  const content = await prisma.content.findUnique({ where: { id } });
  if (!content) throw new AppError(404, 'Content not found');

  await cancelContentJobs(id);
  if (content.storagePath) {
    await storageService.delete(content.storagePath).catch(() => {});
  }
  await prisma.content.delete({ where: { id } });

  await writeAdminAuditLog({
    adminUserId: req.user.userId,
    action: 'content.delete',
    targetType: 'content',
    targetId: id,
    metadata: { title: content.title, userId: content.userId },
  });

  res.status(204).send();
}

export async function retryContentJob(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const id = getParam(req, 'id');
  const content = await prisma.content.findUnique({ where: { id } });
  if (!content) throw new AppError(404, 'Content not found');
  if (content.status !== 'FAILED') {
    throw new AppError(400, 'Only failed content can be retried');
  }

  const updated = await prisma.content.update({
    where: { id },
    data: { status: 'PENDING' },
  });
  await contentQueue.add({ contentId: id });
  await writeAdminAuditLog({
    adminUserId: req.user.userId,
    action: 'content.retry_job',
    targetType: 'content',
    targetId: id,
    metadata: { title: content.title },
  });
  res.json({
    content: {
      id: updated.id,
      status: updated.status,
      title: updated.title,
    },
  });
}

export async function listGenerated(req: AuthenticatedRequest, res: Response): Promise<void> {
  const kind = typeof req.query.kind === 'string' ? req.query.kind : 'all';

  const [podcasts, quizzes, slideshows, summaries] = await Promise.all([
    kind === 'all' || kind === 'podcast'
      ? prisma.podcast.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { content: { select: { title: true, userId: true, user: { select: { email: true } } } } },
        })
      : [],
    kind === 'all' || kind === 'quiz'
      ? prisma.quiz.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { content: { select: { title: true, userId: true, user: { select: { email: true } } } } },
        })
      : [],
    kind === 'all' || kind === 'slideshow'
      ? prisma.contentVideo.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { content: { select: { title: true, userId: true, user: { select: { email: true } } } } },
        })
      : [],
    kind === 'all' || kind === 'summary'
      ? prisma.contentSummary.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { content: { select: { title: true, userId: true, user: { select: { email: true } } } } },
        })
      : [],
  ]);

  const items = [
    ...podcasts.map((p) => ({
      id: p.id,
      kind: 'podcast' as const,
      contentId: p.contentId,
      contentTitle: p.content.title,
      userId: p.content.userId,
      userEmail: p.content.user.email,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    })),
    ...quizzes.map((q) => ({
      id: q.id,
      kind: 'quiz' as const,
      contentId: q.contentId,
      contentTitle: q.content.title,
      userId: q.content.userId,
      userEmail: q.content.user.email,
      createdAt: q.createdAt.toISOString(),
    })),
    ...slideshows.map((v) => ({
      id: v.id,
      kind: 'slideshow' as const,
      contentId: v.contentId,
      contentTitle: v.content.title,
      userId: v.content.userId,
      userEmail: v.content.user.email,
      status: v.status,
      createdAt: v.createdAt.toISOString(),
    })),
    ...summaries.map((s) => ({
      id: s.id,
      kind: 'summary' as const,
      contentId: s.contentId,
      contentTitle: s.content.title,
      userId: s.content.userId,
      userEmail: s.content.user.email,
      createdAt: s.createdAt.toISOString(),
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Left-join review status by (kind, mediaId). One query; default PENDING.
  const reviews = items.length
    ? await prisma.generatedMediaReview.findMany({
        where: { OR: items.map((it) => ({ kind: it.kind, mediaId: it.id })) },
        select: { kind: true, mediaId: true, status: true },
      })
    : [];
  const reviewByKey = new Map(reviews.map((r) => [`${r.kind}:${r.mediaId}`, r.status]));

  const enriched = items.map((it) => ({
    ...it,
    reviewStatus: reviewByKey.get(`${it.kind}:${it.id}`) ?? 'PENDING',
  }));

  res.json({ items: enriched });
}

const GENERATED_KINDS = ['podcast', 'quiz', 'slideshow', 'summary'] as const;
const reviewBodySchema = z.object({
  status: z.enum(['APPROVED', 'FLAGGED']),
  note: z.string().max(2000).optional(),
});

/**
 * Approve/flag a generated-media item. Upserts GeneratedMediaReview keyed by
 * (kind, mediaId) — one row backs review across all generated-media types.
 */
export async function reviewGenerated(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const kind = getParam(req, 'kind');
  const mediaId = getParam(req, 'mediaId');
  if (!(GENERATED_KINDS as readonly string[]).includes(kind)) {
    throw new AppError(400, 'kind must be one of: podcast|quiz|slideshow|summary');
  }
  const body = reviewBodySchema.parse(req.body ?? {});

  const review = await prisma.generatedMediaReview.upsert({
    where: { kind_mediaId: { kind, mediaId } },
    create: {
      kind,
      mediaId,
      status: body.status,
      note: body.note ?? null,
      reviewedById: req.user.userId,
    },
    update: {
      status: body.status,
      note: body.note ?? null,
      reviewedById: req.user.userId,
    },
  });

  await writeAdminAuditLog({
    adminUserId: req.user.userId,
    action: 'generated.review',
    targetType: kind,
    targetId: mediaId,
    metadata: { status: body.status, note: body.note ?? null },
  });

  res.json({
    review: {
      kind: review.kind,
      mediaId: review.mediaId,
      status: review.status,
      note: review.note,
      reviewedById: review.reviewedById,
      updatedAt: review.updatedAt.toISOString(),
    },
  });
}

/**
 * Read-only content inspector: the content row, pipeline state (text/chunks/
 * sections), which generated media exist + their status, and a chunk sample.
 * The pgvector embedding column is NEVER selected — only tested for presence.
 */
export async function contentDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
  const id = getParam(req, 'id');
  const content = await prisma.content.findUnique({
    where: { id },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!content) throw new AppError(404, 'Content not found');

  const [
    chunkCount,
    sectionCount,
    summaryCount,
    podcast,
    video,
    quizCount,
    sample,
  ] = await Promise.all([
    prisma.chunk.count({ where: { contentId: id } }),
    prisma.contentSection.count({ where: { contentId: id } }),
    prisma.contentSummary.count({ where: { contentId: id } }),
    prisma.podcast.findFirst({
      where: { contentId: id },
      orderBy: { createdAt: 'desc' },
      select: { status: true },
    }),
    prisma.contentVideo.findFirst({
      where: { contentId: id },
      orderBy: { createdAt: 'desc' },
      select: { status: true },
    }),
    prisma.quiz.count({ where: { contentId: id } }),
    getChunkSample(id),
  ]);

  res.json({
    content: {
      id: content.id,
      userId: content.userId,
      userEmail: content.user.email,
      userName: content.user.name,
      tenantId: content.tenantId,
      type: content.type,
      title: content.title,
      url: content.url,
      storagePath: content.storagePath,
      status: content.status,
      createdAt: content.createdAt.toISOString(),
      updatedAt: content.updatedAt.toISOString(),
    },
    pipeline: {
      textExtracted: chunkCount > 0,
      chunked: chunkCount > 0,
      sectioned: sectionCount > 0,
      chunkCount,
      embeddedChunkCount: sample.embeddedChunkCount,
      sectionCount,
    },
    generated: {
      summary: { present: summaryCount > 0, count: summaryCount },
      podcast: { present: podcast != null, status: podcast?.status ?? null },
      video: { present: video != null, status: video?.status ?? null },
      quiz: { present: quizCount > 0, count: quizCount },
    },
    chunks: sample.chunks,
  });
}

export async function deleteGenerated(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const id = getParam(req, 'id');
  const kind = typeof req.query.kind === 'string' ? req.query.kind : '';

  if (kind === 'podcast') {
    await prisma.podcast.delete({ where: { id } });
  } else if (kind === 'quiz') {
    await prisma.quiz.delete({ where: { id } });
  } else if (kind === 'slideshow') {
    const video = await prisma.contentVideo.findUnique({ where: { id } });
    if (!video) throw new AppError(404, 'Generated item not found');
    if (video.storagePath) await storageService.delete(video.storagePath).catch(() => {});
    await prisma.contentVideo.delete({ where: { id } });
  } else if (kind === 'summary') {
    await prisma.contentSummary.delete({ where: { id } });
  } else {
    throw new AppError(400, 'kind query param required: podcast|quiz|slideshow|summary');
  }

  await writeAdminAuditLog({
    adminUserId: req.user.userId,
    action: 'generated.delete',
    targetType: kind,
    targetId: id,
  });

  res.status(204).send();
}
