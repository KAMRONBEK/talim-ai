import type { Response } from 'express';
import { ContentType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { storageService } from '../services/storage.service.js';
import { cancelContentJobs, contentQueue } from '../services/queue.service.js';
import { extractYoutubeVideoId } from '../services/youtube.service.js';
import { getParam } from '../lib/params.js';
import { decodeUploadFilename } from '../lib/filename.js';
import { extractRegionTextFromImage } from '../services/pdf.service.js';
import { assertQuota } from '../services/subscription.service.js';
import { assertTenantOwnsContent } from '../services/contentAccess.service.js';
import {
  youtubeSchema,
  ocrRegionSchema,
  reparseSchema,
  sendContentFile,
  loadOrBackfillTranscript,
  enqueueReparse,
} from './content-shared.js';

function formatContent(content: {
  id: string;
  userId: string;
  tenantId: string | null;
  type: string;
  title: string;
  url: string | null;
  storagePath: string | null;
  status: string;
  createdAt: Date;
}) {
  return {
    id: content.id,
    userId: content.userId,
    tenantId: content.tenantId,
    type: content.type,
    title: content.title,
    url: content.url,
    storagePath: content.storagePath,
    status: content.status,
    createdAt: content.createdAt.toISOString(),
  };
}

function requireTenantId(req: AuthenticatedRequest): string {
  if (!req.user?.tenantId) throw new AppError(403, 'Organization context required');
  return req.user.tenantId;
}

export async function listContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = requireTenantId(req);
  const contents = await prisma.content.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ contents: contents.map(formatContent) });
}

export async function getContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = requireTenantId(req);
  await assertTenantOwnsContent(tenantId, getParam(req, 'id'));
  const content = await prisma.content.findFirstOrThrow({
    where: { id: getParam(req, 'id'), tenantId },
  });
  res.json({ content: formatContent(content) });
}

export async function uploadContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const tenantId = requireTenantId(req);
  if (!req.file) throw new AppError(400, 'No file uploaded');

  // multer/busboy decodes the multipart filename as latin1; recover UTF-8 (e.g. Cyrillic names).
  const originalName = decodeUploadFilename(req.file.originalname);
  const isPdf = req.file.mimetype === 'application/pdf' || originalName.endsWith('.pdf');
  const type = isPdf ? ContentType.PDF : ContentType.SLIDE;
  const storagePath = await storageService.save(req.file.buffer, originalName);

  const content = await prisma.content.create({
    data: {
      userId: req.user.userId,
      tenantId,
      type,
      title: originalName,
      storagePath,
      status: 'PENDING',
    },
  });

  await contentQueue.add({ contentId: content.id });
  res.status(201).json({ content: formatContent(content) });
}

export async function createYoutubeContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const tenantId = requireTenantId(req);
  const body = youtubeSchema.parse(req.body);
  const videoId = extractYoutubeVideoId(body.url);
  if (!videoId) throw new AppError(400, 'Invalid YouTube URL');

  const content = await prisma.content.create({
    data: {
      userId: req.user.userId,
      tenantId,
      type: ContentType.YOUTUBE,
      title: body.title ?? `YouTube Video ${videoId}`,
      url: body.url,
      status: 'PENDING',
    },
  });

  await contentQueue.add({ contentId: content.id });
  res.status(201).json({ content: formatContent(content) });
}

/**
 * Re-read a tenant document via vision OCR of client-rasterized page images.
 * The OCR + re-embed take 1–4+ minutes, so the work runs as a Bull job
 * (reparseContent.job.ts): stage the page images in storage, flip to
 * PROCESSING, enqueue, respond 202 — the client's processing screen + the SSE
 * content.status event close the loop.
 */
export async function reparseContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const tenantId = requireTenantId(req);
  const content = await assertTenantOwnsContent(tenantId, getParam(req, 'id'));
  if (content.type !== ContentType.PDF && content.type !== ContentType.SLIDE) {
    throw new AppError(400, 'Only PDF or slide documents can be re-read');
  }
  const { pages } = reparseSchema.parse(req.body ?? {});

  await assertQuota(req.user.userId, 'GENERATION', { role: req.user.role, tenantId });

  const updated = await enqueueReparse(content, req.user.userId, pages);
  res.status(202).json({ content: formatContent(updated) });
}

export async function retryContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = requireTenantId(req);
  const content = await assertTenantOwnsContent(tenantId, getParam(req, 'id'));
  if (content.status !== 'FAILED') {
    throw new AppError(400, 'Only failed content can be retried');
  }
  // Match the B2C retry path: don't re-queue content whose source is gone — the
  // ingest job would just fail again. Surface the actionable error up front.
  if (content.type === 'YOUTUBE') {
    if (!content.url) throw new AppError(400, 'YouTube URL missing');
  } else if (!content.storagePath) {
    throw new AppError(400, 'File no longer available — please upload again');
  }

  const updated = await prisma.content.update({
    where: { id: content.id },
    data: { status: 'PENDING' },
  });

  await contentQueue.add({ contentId: content.id });
  res.json({ content: formatContent(updated) });
}

export async function deleteContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = requireTenantId(req);
  const content = await assertTenantOwnsContent(tenantId, getParam(req, 'id'));

  await cancelContentJobs(content.id);

  const podcasts = await prisma.podcast.findMany({
    where: { contentId: content.id },
    include: { episodes: true },
  });
  for (const podcast of podcasts) {
    await Promise.all(
      podcast.episodes
        .filter((episode) => episode.audioPath)
        .map((episode) => storageService.delete(episode.audioPath!)),
    );
  }

  const videos = await prisma.contentVideo.findMany({ where: { contentId: content.id } });
  await Promise.all(
    videos.filter((v) => v.storagePath).map((v) => storageService.delete(v.storagePath!)),
  );

  if (content.storagePath) {
    await storageService.delete(content.storagePath);
  }

  await prisma.content.delete({ where: { id: content.id } });
  res.status(204).send();
}

export async function getContentFile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = requireTenantId(req);
  const content = await assertTenantOwnsContent(tenantId, getParam(req, 'id'));
  if (!content.storagePath) throw new AppError(404, 'File not available');

  await sendContentFile(res, content.storagePath);
}

export async function ocrPdfRegion(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const tenantId = requireTenantId(req);
  const body = ocrRegionSchema.parse(req.body);
  const content = await assertTenantOwnsContent(tenantId, getParam(req, 'id'));
  if (content.type !== 'PDF') throw new AppError(404, 'PDF content not found');

  const base64 = body.image.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64, 'base64');
  if (imageBuffer.length === 0) throw new AppError(400, 'Invalid image data');

  const text = await extractRegionTextFromImage(imageBuffer, {
    userId: req.user.userId,
    metadata: { contentId: content.id, tenantId },
  });
  res.json({ text, page: body.page });
}

export async function getContentTranscript(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const tenantId = requireTenantId(req);
  const contentId = getParam(req, 'id');
  const content = await assertTenantOwnsContent(tenantId, contentId);
  if (content.type !== ContentType.YOUTUBE) throw new AppError(404, 'YouTube content not found');

  const transcript = await loadOrBackfillTranscript(content, {
    userId: req.user.userId,
    tenantId,
    metadata: { contentId },
  });
  res.json({ transcript });
}
