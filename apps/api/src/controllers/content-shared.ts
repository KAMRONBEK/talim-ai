import type { Response } from 'express';
import path from 'path';
import { z } from 'zod';
import type { Content, ContentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { storageService } from '../services/storage.service.js';
import {
  reparseQueue,
  transcriptQueue,
  type BackfillTranscriptJobData,
} from '../services/queue.service.js';
import { publishContentEventTo } from '../services/events/jobEventAudience.js';
import type { UsageContext } from '../services/usage.service.js';

/** A failed transcript backfill is reported as-is for this long before a fresh GET
 *  is allowed to retry it — the source may have recovered (transient 429 / network),
 *  but we must not re-hit it on every request. */
const TRANSCRIPT_RETRY_AFTER_MS = 10 * 60_000;

/** Bull states in which a backfill job is genuinely in flight (don't double-enqueue). */
const TRANSCRIPT_LIVE_STATES = new Set(['active', 'waiting', 'delayed', 'paused']);

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

/**
 * Atomically claim a document for re-read (OCR) and enqueue the background job. Shared
 * by the B2C (`content.controller`) and tenant (`tenant-content.controller`) surfaces —
 * they differ only in access scoping (already enforced by the caller) and quota context.
 * Returns the freshly-claimed content (status PROCESSING) for the 202 response.
 */
export async function enqueueReparse(
  content: { id: string; userId: string; status: string },
  requesterUserId: string,
  pages: string[],
): Promise<Content> {
  // Atomic claim: flip to PROCESSING only if it is not already processing. This closes
  // the read-then-write race — a concurrent double-submit (double-click / two tabs)
  // matches 0 rows and 409s, so exactly one OCR pass is enqueued (no double GENERATION
  // charge, no racing ingestText chunk replacement).
  const claim = await prisma.content.updateMany({
    where: { id: content.id, status: { not: 'PROCESSING' } },
    data: { status: 'PROCESSING' },
  });
  if (claim.count === 0) {
    throw new AppError(409, 'Document is already being processed');
  }

  // The page images (~10MB) are too big for a Redis job payload — stage them in storage
  // and enqueue only the key. The job deletes the blob when it finishes.
  const pagesStorageKey = await storageService.save(
    Buffer.from(JSON.stringify(pages), 'utf8'),
    `reparse-${content.id}.json`,
  );
  try {
    await reparseQueue.add({ contentId: content.id, userId: requesterUserId, pagesStorageKey });
  } catch (error) {
    // A failed enqueue must not strand the content in PROCESSING (the exact bug this
    // job-based flow removes) — release the claim (guarded so a concurrent run's write
    // isn't clobbered) and drop the staged blob.
    await prisma.content
      .updateMany({
        where: { id: content.id, status: 'PROCESSING' },
        data: { status: content.status as ContentStatus },
      })
      .catch(() => undefined);
    await Promise.resolve(storageService.delete(pagesStorageKey)).catch(() => undefined);
    throw error;
  }

  // Notify the OWNER only. A learner reading this assigned material must not be evicted
  // to the processing screen for the multi-minute re-ingest — they keep the last-READY
  // view until the job's terminal content.status READY event fans out to everyone.
  publishContentEventTo([content.userId], {
    type: 'content.status',
    contentId: content.id,
    status: 'PROCESSING',
  });

  // Re-read the full row (the atomic claim used updateMany, which can't return it) so the
  // 202 reply carries the same shape both controllers' formatContent expect.
  const updated = await prisma.content.findUnique({ where: { id: content.id } });
  if (!updated) throw new AppError(404, 'Content not found');
  return updated;
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

function emptyTranscript(contentId: string, status: 'transcribing' | 'failed') {
  return { contentId, source: null, durationMs: null, segments: [], status };
}

/**
 * Return a YouTube content's transcript, lazily backfilling the stored segments
 * from the source video the first time it is requested. The caller is
 * responsible for access control and for confirming `content.type === YOUTUBE`.
 *
 * The backfill runs as a Bull job (the AI-transcription fallback can take
 * minutes — far too long to await in a GET): when segments are missing this
 * enqueues once (job id = contentId, so concurrent GETs cannot double-enqueue)
 * and immediately returns `status: 'transcribing'` with empty segments. The job
 * publishes `transcript.status` over SSE when it finishes, and clients refetch.
 */
export async function loadOrBackfillTranscript(
  content: { id: string; url: string | null; title: string },
  usage: UsageContext,
) {
  const segments = await prisma.contentTranscriptSegment.findMany({
    where: { contentId: content.id },
    orderBy: { order: 'asc' },
  });

  if (segments.length === 0 && content.url) {
    const existingJob = await transcriptQueue.getJob(content.id);
    const state = existingJob ? await existingJob.getState().catch(() => null) : null;

    if (state === 'failed') {
      // A failed Bull job is a failure marker, but a *transient* failure (429 / network
      // blip) must not brick the transcript forever: report it while fresh, then after a
      // cooldown clear the marker so the next GET retries. Only a genuinely unfetchable
      // video keeps failing.
      const failedRecently =
        Date.now() - (existingJob?.finishedOn ?? 0) < TRANSCRIPT_RETRY_AFTER_MS;
      if (failedRecently) return emptyTranscript(content.id, 'failed');
      await existingJob?.remove().catch(() => undefined);
    } else if (existingJob && TRANSCRIPT_LIVE_STATES.has(state ?? '')) {
      // A backfill is genuinely in flight — the job's own transcript.status event closes
      // the loop; don't stack a second one.
      return emptyTranscript(content.id, 'transcribing');
    } else if (existingJob) {
      // Completed marker (segments were later removed) OR an indeterminate state — the
      // job aged out of Redis / getState() failed. Either way, with segments still empty
      // we must clear it, otherwise Bull's job-id dedup silently drops the re-enqueue and
      // the transcript is stuck 'transcribing' with no running job.
      await existingJob.remove().catch(() => undefined);
    }

    const data: BackfillTranscriptJobData = {
      contentId: content.id,
      userId: usage.userId,
      tenantId: usage.tenantId,
    };
    await transcriptQueue.add(data, {
      jobId: content.id,
      attempts: 2,
      backoff: { type: 'fixed', delay: 30_000 },
    });
    return emptyTranscript(content.id, 'transcribing');
  }

  const lastSegment = segments.at(-1);
  return {
    contentId: content.id,
    source: segments[0]?.source ?? null,
    durationMs: lastSegment?.endMs ?? null,
    segments: segments.map(formatTranscriptSegment),
    status: 'ready' as const,
  };
}
