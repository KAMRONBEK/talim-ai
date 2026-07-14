import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { extractYoutubeTranscript } from '../services/youtube.service.js';
import { transcriptQueue, type BackfillTranscriptJobData } from '../services/queue.service.js';
import { publishContentEvent } from '../services/events/jobEventAudience.js';

/**
 * Lazy YouTube-transcript backfill for legacy/pre-segment content rows. The captions
 * path takes seconds, but the fallback (ytdl audio download + AI transcription) can
 * take minutes — far too long for the GET /content/:id/transcript request it used to
 * run inline in. The Bull job id is the contentId (deterministic), so concurrent GETs
 * can never enqueue duplicate transcriptions, and the failed job doubles as a
 * persisted marker that stops a permanently failing video from re-enqueueing on
 * every GET.
 */
export function registerBackfillTranscriptJob(): void {
  transcriptQueue.process(async (job) => {
    const { contentId, userId, tenantId } = job.data as BackfillTranscriptJobData;

    const content = await prisma.content.findUnique({ where: { id: contentId } });
    // Deleted while queued — nothing to backfill and nobody left to notify.
    if (!content) return;
    if (!content.url) throw new Error(`Content ${contentId} has no YouTube URL`);

    // Another path (e.g. a reprocess) may have stored segments while we waited in
    // the queue — don't re-transcribe, just tell clients the transcript is there.
    const existing = await prisma.contentTranscriptSegment.count({ where: { contentId } });
    if (existing === 0) {
      const transcript = await extractYoutubeTranscript(content.url, {
        title: content.title,
        locale: env.DEFAULT_CONTENT_LOCALE,
        usage: { userId, tenantId, metadata: { contentId } },
      });
      await prisma.$transaction([
        prisma.contentTranscriptSegment.deleteMany({ where: { contentId } }),
        prisma.contentTranscriptSegment.createMany({
          data: transcript.segments.map((segment) => ({
            contentId,
            order: segment.order,
            startMs: segment.startMs,
            endMs: segment.endMs,
            text: segment.text,
            source: segment.source,
          })),
        }),
      ]);
    }

    void publishContentEvent(contentId, {
      type: 'transcript.status',
      contentId,
      status: 'READY',
    });
  });

  transcriptQueue.on('failed', async (job, err) => {
    console.error(`Transcript backfill job ${job?.id} failed:`, err.message);
    // Bull emits 'failed' on every attempt; only the final one (no retries left)
    // should tell clients the transcript failed.
    if (job && job.attemptsMade < (job.opts.attempts ?? 1)) return;
    const data = job?.data as BackfillTranscriptJobData | undefined;
    if (!data?.contentId) return;
    await publishContentEvent(data.contentId, {
      type: 'transcript.status',
      contentId: data.contentId,
      status: 'FAILED',
    });
  });
}
