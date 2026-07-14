import type Bull from 'bull';
import { prisma } from '../lib/prisma.js';
import {
  contentQueue,
  reparseQueue,
  slidesQueue,
  bankQuestionsQueue,
  podcastQueue,
  videoQueue,
  flashcardQueue,
} from './queue.service.js';
import { deckScopeKey } from './slides.service.js';

/** Bull states in which a job is still going to run (or is running) — i.e. it will
 *  eventually resolve the DB claim itself, so the row is NOT orphaned. */
const LIVE_STATES: Bull.JobStatus[] = ['active', 'waiting', 'delayed', 'paused'];

async function collectLiveJobData<T>(queues: Bull.Queue[]): Promise<T[]> {
  const out: T[] = [];
  for (const queue of queues) {
    const jobs = await queue.getJobs(LIVE_STATES);
    for (const job of jobs) out.push(job.data as T);
  }
  return out;
}

/**
 * Generic "row id == Bull job field" reconciliation: flip every GENERATING row whose id is
 * not backed by a live job to FAILED. Returns the number of rows reconciled. Used for the
 * media types whose queue job carries the row's own id (podcast/video/flashcard).
 */
async function reconcileRowStatus(opts: {
  queues: Bull.Queue[];
  jobIdKey: string;
  findStuck: () => Promise<{ id: string }[]>;
  fail: (ids: string[]) => Promise<unknown>;
}): Promise<number> {
  const jobs = await collectLiveJobData<Record<string, unknown>>(opts.queues);
  const liveIds = new Set(
    jobs.map((d) => d[opts.jobIdKey]).filter((id): id is string => typeof id === 'string'),
  );
  const stuck = await opts.findStuck();
  const orphanIds = stuck.map((r) => r.id).filter((id) => !liveIds.has(id));
  if (orphanIds.length) await opts.fail(orphanIds);
  return orphanIds.length;
}

/**
 * On boot, flip any media row still marked in-flight (content PROCESSING, slide deck or
 * question bank GENERATING) that has NO live Bull job backing it to FAILED.
 *
 * This is the recovery path for the durability gap where a process restart or Redis
 * eviction drops the job *after* the optimistic DB claim was written: without it the row
 * spins forever and the dedup/claim guard 409s every retry, leaving the feature
 * permanently un-generatable with no user-facing escape. Flipping to FAILED re-enables
 * the existing "Retry" affordances.
 *
 * No SSE publish: this runs before any client has (re)connected, so there is nothing to
 * notify — clients pick up the FAILED status on their next refetch. Best-effort and
 * total: it must never throw and block startup.
 */
export async function reconcileStuckMediaClaims(): Promise<void> {
  try {
    // --- Content (ingest + reparse) stuck in PROCESSING ---
    const contentJobs = await collectLiveJobData<{ contentId?: string }>([
      contentQueue,
      reparseQueue,
    ]);
    const liveContentIds = new Set(
      contentJobs.map((d) => d.contentId).filter((id): id is string => !!id),
    );
    const stuckContent = await prisma.content.findMany({
      where: { status: 'PROCESSING' },
      select: { id: true },
    });
    const orphanContentIds = stuckContent.map((c) => c.id).filter((id) => !liveContentIds.has(id));
    if (orphanContentIds.length) {
      await prisma.content.updateMany({
        where: { id: { in: orphanContentIds }, status: 'PROCESSING' },
        data: { status: 'FAILED' },
      });
    }

    // --- Slide decks stuck in GENERATING (identity = contentId + locale + scopeKey) ---
    const slideJobs = await collectLiveJobData<{
      contentId?: string;
      locale?: string;
      sectionId?: string;
    }>([slidesQueue]);
    const liveDeckKeys = new Set(
      slideJobs
        .filter((d) => d.contentId && d.locale)
        .map((d) => `${d.contentId}:${d.locale}:${deckScopeKey(d.sectionId)}`),
    );
    const stuckDecks = await prisma.contentSlideDeck.findMany({
      where: { status: 'GENERATING' },
      select: { id: true, contentId: true, locale: true, scopeKey: true },
    });
    const orphanDeckIds = stuckDecks
      .filter((d) => !liveDeckKeys.has(`${d.contentId}:${d.locale}:${d.scopeKey}`))
      .map((d) => d.id);
    if (orphanDeckIds.length) {
      await prisma.contentSlideDeck.updateMany({
        where: { id: { in: orphanDeckIds }, status: 'GENERATING' },
        data: { status: 'FAILED' },
      });
    }

    // --- Question banks stuck in GENERATING ---
    const bankJobs = await collectLiveJobData<{ bankId?: string }>([bankQuestionsQueue]);
    const liveBankIds = new Set(bankJobs.map((d) => d.bankId).filter((id): id is string => !!id));
    const stuckBanks = await prisma.questionBank.findMany({
      where: { generationStatus: 'GENERATING' },
      select: { id: true },
    });
    const orphanBankIds = stuckBanks.map((b) => b.id).filter((id) => !liveBankIds.has(id));
    if (orphanBankIds.length) {
      await prisma.questionBank.updateMany({
        where: { id: { in: orphanBankIds }, generationStatus: 'GENERATING' },
        data: {
          generationStatus: 'FAILED',
          generationError: 'Generation was interrupted by a restart. Please try again.',
        },
      });
    }

    // --- Podcast / video / flashcard rows stuck in GENERATING (each row id == job id) ---
    const orphanPodcastIds = await reconcileRowStatus({
      queues: [podcastQueue],
      jobIdKey: 'podcastId',
      findStuck: () =>
        prisma.podcast.findMany({ where: { status: 'GENERATING' }, select: { id: true } }),
      fail: (ids) =>
        prisma.podcast.updateMany({
          where: { id: { in: ids }, status: 'GENERATING' },
          data: { status: 'FAILED' },
        }),
    });
    const orphanVideoIds = await reconcileRowStatus({
      queues: [videoQueue],
      jobIdKey: 'videoId',
      findStuck: () =>
        prisma.contentVideo.findMany({ where: { status: 'GENERATING' }, select: { id: true } }),
      fail: (ids) =>
        prisma.contentVideo.updateMany({
          where: { id: { in: ids }, status: 'GENERATING' },
          data: { status: 'FAILED' },
        }),
    });
    const orphanFlashcardIds = await reconcileRowStatus({
      queues: [flashcardQueue],
      jobIdKey: 'deckId',
      findStuck: () =>
        prisma.flashcardDeck.findMany({ where: { status: 'GENERATING' }, select: { id: true } }),
      fail: (ids) =>
        prisma.flashcardDeck.updateMany({
          where: { id: { in: ids }, status: 'GENERATING' },
          data: { status: 'FAILED' },
        }),
    });

    const total =
      orphanContentIds.length +
      orphanDeckIds.length +
      orphanBankIds.length +
      orphanPodcastIds +
      orphanVideoIds +
      orphanFlashcardIds;
    if (total > 0) {
      console.log(`Reconciled ${total} stuck media claim(s) to FAILED on boot.`);
    }
  } catch (err) {
    console.error('reconcileStuckMediaClaims failed (non-fatal):', err);
  }
}
