import type { Response } from 'express';
import path from 'path';
import { ContentType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { storageService } from '../services/storage.service.js';
import { contentQueue } from '../services/queue.service.js';
import { extractYoutubeVideoId } from '../services/youtube.service.js';
import { getParam } from '../lib/params.js';

const youtubeSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).optional(),
});

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
  const contents = await prisma.content.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ contents: contents.map(formatContent) });
}

export async function getContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const content = await prisma.content.findFirst({
    where: { id: getParam(req, 'id'), userId: req.user.userId },
  });
  if (!content) throw new AppError(404, 'Content not found');
  res.json({ content: formatContent(content) });
}

export async function uploadContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  if (!req.file) throw new AppError(400, 'No file uploaded');

  const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf');
  const type = isPdf ? ContentType.PDF : ContentType.SLIDE;
  const storagePath = await storageService.save(req.file.buffer, req.file.originalname);

  const content = await prisma.content.create({
    data: {
      userId: req.user.userId,
      type,
      title: req.file.originalname,
      storagePath,
      status: 'PENDING',
    },
  });

  await contentQueue.add({ contentId: content.id });
  res.status(201).json({ content: formatContent(content) });
}

export async function createYoutubeContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
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

export async function deleteContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const content = await prisma.content.findFirst({
    where: { id: getParam(req, 'id'), userId: req.user.userId },
  });
  if (!content) throw new AppError(404, 'Content not found');

  if (content.storagePath) {
    await storageService.delete(content.storagePath);
  }

  await prisma.content.delete({ where: { id: content.id } });
  res.status(204).send();
}

export async function getContentFile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const content = await prisma.content.findFirst({
    where: { id: getParam(req, 'id'), userId: req.user.userId },
  });
  if (!content?.storagePath) throw new AppError(404, 'File not available');

  const buffer = await storageService.get(content.storagePath);
  const ext = path.extname(content.storagePath).toLowerCase();
  const contentType =
    ext === '.pdf'
      ? 'application/pdf'
      : ext === '.ppt' || ext === '.pptx'
        ? 'application/vnd.ms-powerpoint'
        : 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(content.storagePath)}"`);
  res.send(buffer);
}
