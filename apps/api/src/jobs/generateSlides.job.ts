import { parseAppLocale } from '@talim/types';
import type { DeckAudience } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { slidesQueue, type GenerateSlidesJobData } from '../services/queue.service.js';
import { generateAndStoreSlideDeck, deckScopeKey } from '../services/slides.service.js';
import { publishContentEvent } from '../services/events/jobEventAudience.js';

/**
 * Manual slide-deck generation (30–120s of LLM work) as a background job: the
 * controller upserts the deck row to GENERATING and returns 202; this processor
 * runs the actual generation. `generateAndStoreSlideDeck` upserts the row READY
 * and publishes `slides.status READY` itself (the same completion point the
 * ingest-time auto-generation uses), so the processor only has to run it.
 */
export function registerGenerateSlidesJob(): void {
  slidesQueue.process(async (job) => {
    const data = job.data as GenerateSlidesJobData;
    await generateAndStoreSlideDeck({
      userId: data.userId,
      tenantId: data.tenantId ?? null,
      contentId: data.contentId,
      title: data.title,
      locale: parseAppLocale(data.locale),
      audience: (data.audience as DeckAudience | undefined) ?? 'students',
      sectionId: data.sectionId,
    });
  });

  slidesQueue.on('failed', async (job, err) => {
    console.error(`Slides job ${job?.id} failed:`, err.message);
    const data = job?.data as GenerateSlidesJobData | undefined;
    if (!data?.contentId) return;
    // Flip the GENERATING row to FAILED so the UI stops spinning and offers retry. Guard
    // on status: 'GENERATING' (mirrors the enqueue rollback) — without it, a late failed
    // event from a superseded duplicate run would clobber a newer run's READY/GENERATING
    // row (there is no jobId dedup, so overlapping regenerate jobs can coexist).
    await prisma.contentSlideDeck
      .updateMany({
        where: {
          contentId: data.contentId,
          locale: parseAppLocale(data.locale),
          scopeKey: deckScopeKey(data.sectionId),
          status: 'GENERATING',
        },
        data: { status: 'FAILED' },
      })
      .catch(() => undefined);
    await publishContentEvent(data.contentId, {
      type: 'slides.status',
      contentId: data.contentId,
      sectionId: data.sectionId,
      status: 'FAILED',
    });
  });
}
