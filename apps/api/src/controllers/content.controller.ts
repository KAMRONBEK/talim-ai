import type { Response } from 'express';
import { ContentType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { storageService } from '../services/storage.service.js';
import { cancelContentJobs, contentQueue } from '../services/queue.service.js';
import { extractYoutubeVideoId } from '../services/youtube.service.js';
import { getParam } from '../lib/params.js';
import { decodeUploadFilename } from '../lib/filename.js';
import {
  extractRegionTextFromImage,
  extractTextFromPageImages,
  getPdfPageCount,
} from '../services/pdf.service.js';
import { captionAndStoreFigures } from '../services/figure.service.js';
import { ingestText } from '../services/ingest.service.js';
import { autoGenerateSectionDecks } from '../services/slides.service.js';
import {
  assertQuota,
  getFileLimitsForUser,
  getFileLimitsForTenant,
} from '../services/subscription.service.js';
import { PlanFileLimitError } from '../middleware/error.middleware.js';
import {
  assertCanAccessContent,
  assertCanMutateContent,
  assertCanGenerate,
  buildContentListWhere,
} from '../services/contentAccess.service.js';
import {
  youtubeSchema,
  ocrRegionSchema,
  reparseSchema,
  sendContentFile,
  loadOrBackfillTranscript,
} from './content-shared.js';

/**
 * Re-read a document via vision OCR of client-rasterized page images, then
 * re-ingest (replaces chunks + sections). The reliable path for scanned/image
 * PDFs whose embedded text layer is empty or junk.
 */
export async function reparseContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  assertCanMutateContent(req.user);
  const content = await assertCanAccessContent(req.user, getParam(req, 'id'));
  if (content.type !== ContentType.PDF && content.type !== ContentType.SLIDE) {
    throw new AppError(400, 'Only PDF or slide documents can be re-read');
  }
  const { pages } = reparseSchema.parse(req.body ?? {});

  await assertQuota(req.user.userId, 'GENERATION', {
    role: req.user.role,
    tenantId: req.user.tenantId,
  });

  await prisma.content.update({ where: { id: content.id }, data: { status: 'PROCESSING' } });
  try {
    const usage = {
      userId: content.userId,
      tenantId: content.tenantId ?? undefined,
      metadata: { contentId: content.id, reparse: true },
    };
    const text = await extractTextFromPageImages(pages, usage);
    const { chunkCount } = await ingestText(content.id, text, usage);
    const updated = await prisma.content.update({ where: { id: content.id }, data: { status: 'READY' } });
    res.json({ content: formatContent(updated), chunks: chunkCount });
    // Caption + index the page figures (best-effort) so diagrams are retrievable.
    void captionAndStoreFigures(content.id, pages, usage).catch(() => {});
    // Pre-generate the new section decks in the background (best-effort).
    void autoGenerateSectionDecks({
      contentId: content.id,
      userId: content.userId,
      tenantId: content.tenantId ?? null,
      role: req.user.role,
      title: content.title,
      locale: env.DEFAULT_CONTENT_LOCALE,
    }).catch(() => {});
  } catch (error) {
    await prisma.content.update({ where: { id: content.id }, data: { status: 'FAILED' } });
    throw error;
  }
}

function formatContent(content: {
  id: string;
  userId: string;
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
    type: content.type,
    title: content.title,
    url: content.url,
    storagePath: content.storagePath,
    status: content.status,
    createdAt: content.createdAt.toISOString(),
  };
}

export async function listContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const where = await buildContentListWhere(req.user);
  const contents = await prisma.content.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ contents: contents.map(formatContent) });
}

export async function getContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const content = await assertCanAccessContent(req.user, getParam(req, 'id'));
  res.json({ content: formatContent(content as never) });
}

export async function uploadContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  assertCanMutateContent(req.user);
  if (!req.file) throw new AppError(400, 'No file uploaded');

  // multer/busboy decodes the multipart filename as latin1; recover UTF-8 (e.g. Cyrillic names).
  const originalName = decodeUploadFilename(req.file.originalname);
  const isPdf = req.file.mimetype === 'application/pdf' || originalName.endsWith('.pdf');
  const type = isPdf ? ContentType.PDF : ContentType.SLIDE;

  // Plan gating: reject files that exceed the plan's page/size caps with a
  // structured error the web app turns into the "exceeds your plan" upgrade modal.
  const fileLimits =
    req.user.role === 'TENANT_OWNER' && req.user.tenantId
      ? await getFileLimitsForTenant(req.user.tenantId)
      : await getFileLimitsForUser(req.user.userId);
  const fileSizeMb = req.file.size / (1024 * 1024);
  let pages: number | null = null;
  if (isPdf) pages = await getPdfPageCount(req.file.buffer);

  const overSize = fileLimits.maxFileSizeMb != null && fileSizeMb > fileLimits.maxFileSizeMb;
  const overPages =
    fileLimits.maxPagesPerFile != null && pages != null && pages > fileLimits.maxPagesPerFile;
  if (overSize || overPages) {
    throw new PlanFileLimitError(
      fileLimits.maxPagesPerFile,
      fileLimits.maxFileSizeMb,
      pages,
      Math.round(fileSizeMb * 10) / 10,
      fileLimits.upgradePlanCode,
    );
  }

  const storagePath = await storageService.save(req.file.buffer, originalName);

  const content = await prisma.content.create({
    data: {
      userId: req.user.userId,
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
  assertCanMutateContent(req.user);
  const body = youtubeSchema.parse(req.body);
  const videoId = extractYoutubeVideoId(body.url);
  if (!videoId) throw new AppError(400, 'Invalid YouTube URL');

  const content = await prisma.content.create({
    data: {
      userId: req.user.userId,
      type: ContentType.YOUTUBE,
      title: body.title ?? `YouTube Video ${videoId}`,
      url: body.url,
      status: 'PENDING',
    },
  });

  await contentQueue.add({ contentId: content.id });
  res.status(201).json({ content: formatContent(content) });
}

export async function retryContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  assertCanMutateContent(req.user);
  const content = await assertCanAccessContent(req.user, getParam(req, 'id'));
  if (content.status !== 'FAILED') {
    throw new AppError(400, 'Only failed content can be retried');
  }
  if (content.type === 'YOUTUBE') {
    if (!content.url) throw new AppError(400, 'YouTube URL missing');
  } else if (!content.storagePath) {
    throw new AppError(400, 'File no longer available — please upload again');
  }

  await assertQuota(req.user.userId, 'GENERATION', {
    role: req.user.role,
    tenantId: req.user.tenantId,
  });

  const updated = await prisma.content.update({
    where: { id: content.id },
    data: { status: 'PENDING' },
  });

  await contentQueue.add({ contentId: content.id });
  res.json({ content: formatContent(updated) });
}

export async function getContentTranscript(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const content = await assertCanAccessContent(req.user, contentId);
  if (content.type !== ContentType.YOUTUBE) throw new AppError(404, 'YouTube content not found');

  const transcript = await loadOrBackfillTranscript(content, {
    userId: req.user.userId,
    metadata: { contentId },
  });
  res.json({ transcript });
}

export async function deleteContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  assertCanMutateContent(req.user);
  const content = await assertCanAccessContent(req.user, getParam(req, 'id'));

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

  const videos = await prisma.contentVideo.findMany({
    where: { contentId: content.id },
  });
  await Promise.all(
    videos
      .filter((v) => v.storagePath)
      .map((v) => storageService.delete(v.storagePath!)),
  );

  if (content.storagePath) {
    await storageService.delete(content.storagePath);
  }

  await prisma.content.delete({ where: { id: content.id } });
  res.status(204).send();
}

export async function ocrPdfRegion(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const body = ocrRegionSchema.parse(req.body);

  const content = await assertCanAccessContent(req.user, getParam(req, 'id'));
  if (content.type !== 'PDF') throw new AppError(404, 'PDF content not found');

  const base64 = body.image.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64, 'base64');
  if (imageBuffer.length === 0) throw new AppError(400, 'Invalid image data');

  const text = await extractRegionTextFromImage(imageBuffer, {
    userId: req.user.userId,
    metadata: { contentId: content.id },
  });
  res.json({ text, page: body.page });
}

export async function getContentFile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const content = await assertCanAccessContent(req.user, getParam(req, 'id'));
  if (!content.storagePath) throw new AppError(404, 'File not available');

  await sendContentFile(res, content.storagePath);
}
