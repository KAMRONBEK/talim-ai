import type { Response } from 'express';
import path from 'path';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { storageService } from '../services/storage.service.js';
import { extractYoutubeTranscript } from '../services/youtube.service.js';
import type { UsageContext } from '../services/usage.service.js';

// Request schemas shared by the B2C (`content.controller`) and tenant
// (`tenant-content.controller`) surfaces — the two controllers differ only in
// how they scope access (user-owned vs tenant-owned), not in their payloads.
export const youtubeSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).optional(),
});

export const ocrRegionSchema = z.object({
  page: z.number().int().min(1),
  image: z.string().min(1),
});

export const reparseSchema = z.object({
  // Per-page images (data URLs) rasterized by the client; OCR'd server-side.
  pages: z.array(z.string().min(1)).min(1).max(30),
});

export function formatTranscriptSegment(segment: {
  id: string;
  contentId: string;
  order: number;
  startMs: number;
  endMs: number;
  text: string;
  source: string;
}) {
  return {
    id: segment.id,
    contentId: segment.contentId,
    order: segment.order,
    startMs: segment.startMs,
    endMs: segment.endMs,
    text: segment.text,
    source: segment.source,
  };
}

/** Stream a stored content file with the right Content-Type/Disposition headers. */
export async function sendContentFile(res: Response, storagePath: string): Promise<void> {
  const buffer = await storageService.get(storagePath);
  const ext = path.extname(storagePath).toLowerCase();
  const contentType =
    ext === '.pdf'
      ? 'application/pdf'
      : ext === '.ppt' || ext === '.pptx'
        ? 'application/vnd.ms-powerpoint'
        : 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(storagePath)}"`);
  res.send(buffer);
}

/**
 * Return a YouTube content's transcript, lazily backfilling the stored segments
 * from the source video the first time it is requested. The caller is
 * responsible for access control and for confirming `content.type === YOUTUBE`.
 */
export async function loadOrBackfillTranscript(
  content: { id: string; url: string | null; title: string },
  usage: UsageContext,
) {
  let segments = await prisma.contentTranscriptSegment.findMany({
    where: { contentId: content.id },
    orderBy: { order: 'asc' },
  });

  if (segments.length === 0 && content.url) {
    const transcript = await extractYoutubeTranscript(content.url, {
      title: content.title,
      locale: env.DEFAULT_CONTENT_LOCALE,
      usage,
    });
    await prisma.$transaction([
      prisma.contentTranscriptSegment.deleteMany({ where: { contentId: content.id } }),
      prisma.contentTranscriptSegment.createMany({
        data: transcript.segments.map((segment) => ({
          contentId: content.id,
          order: segment.order,
          startMs: segment.startMs,
          endMs: segment.endMs,
          text: segment.text,
          source: segment.source,
        })),
      }),
    ]);
    segments = await prisma.contentTranscriptSegment.findMany({
      where: { contentId: content.id },
      orderBy: { order: 'asc' },
    });
  }

  const lastSegment = segments.at(-1);
  return {
    contentId: content.id,
    source: segments[0]?.source ?? null,
    durationMs: lastSegment?.endMs ?? null,
    segments: segments.map(formatTranscriptSegment),
  };
}
