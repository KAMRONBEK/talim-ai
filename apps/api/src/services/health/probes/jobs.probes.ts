import type Bull from 'bull';
import { prisma } from '../../../lib/prisma.js';
import {
  bankQuestionsQueue,
  contentQueue,
  flashcardQueue,
  manimQueue,
  podcastQueue,
  quizQueue,
  reparseQueue,
  slidesQueue,
  transcriptQueue,
  videoQueue,
} from '../../queue.service.js';
import type { ProbeDefinition } from '../runner.js';

/** Backlog with no active worker = a wedged processor, not just a busy one. */
const WEDGED_WAITING_THRESHOLD = 10;
/**
 * A 200-page scanned book legitimately holds PROCESSING for 15-20 minutes, so
 * only flag in-flight rows older than this. (The boot-time reconciler checks live
 * Bull state instead; this probe is a cheap read-only approximation.)
 */
const STUCK_AFTER_MINUTES = 30;

const ALL_QUEUES: { name: string; queue: Bull.Queue }[] = [
  { name: 'process-content', queue: contentQueue },
  { name: 'reparse-content', queue: reparseQueue },
  { name: 'generate-quiz', queue: quizQueue },
  { name: 'generate-podcast', queue: podcastQueue },
  { name: 'generate-video', queue: videoQueue },
  { name: 'generate-flashcards', queue: flashcardQueue },
  { name: 'generate-slides', queue: slidesQueue },
  { name: 'render-manim', queue: manimQueue },
  { name: 'generate-bank-questions', queue: bankQuestionsQueue },
  { name: 'backfill-transcript', queue: transcriptQueue },
];

export const jobProbes: ProbeDefinition[] = [
  {
    id: 'queue-health',
    group: 'jobs',
    label: 'Bull queues (10)',
    deep: false,
    timeoutMs: 6000,
    timeoutStatus: 'down',
    remediation:
      'The API process is also the worker: `docker compose restart api` re-registers all ten processors and runs the stuck-job reconciler at boot. Inspect a specific backlog with `docker compose exec redis redis-cli LLEN bull:<queue-name>:wait`.',
    run: async () => {
      const states = await Promise.all(
        ALL_QUEUES.map(async ({ name, queue }) => {
          const [counts, paused] = await Promise.all([queue.getJobCounts(), queue.isPaused()]);
          return { name, paused, ...counts };
        }),
      );

      const pausedQueues = states.filter((s) => s.paused).map((s) => s.name);
      // Waiting jobs with zero active means nothing is draining the queue.
      const wedged = states
        .filter((s) => s.waiting > WEDGED_WAITING_THRESHOLD && s.active === 0)
        .map((s) => `${s.name} (${s.waiting} waiting)`);
      const totalFailed = states.reduce((sum, s) => sum + s.failed, 0);
      const totalWaiting = states.reduce((sum, s) => sum + s.waiting, 0);
      const totalActive = states.reduce((sum, s) => sum + s.active, 0);

      const detail: Record<string, number | string | boolean> = {
        totalWaiting,
        totalActive,
        totalFailed,
      };
      for (const s of states) {
        if (s.waiting || s.active || s.failed || s.paused) {
          detail[s.name] = `${s.waiting} waiting · ${s.active} active · ${s.failed} failed${s.paused ? ' · PAUSED' : ''}`;
        }
      }

      if (pausedQueues.length > 0) {
        return {
          status: 'degraded' as const,
          message: `${pausedQueues.length} queue(s) are PAUSED and will never process: ${pausedQueues.join(', ')}.`,
          detail,
        };
      }
      if (wedged.length > 0) {
        return {
          status: 'degraded' as const,
          message: `Backlog with no active worker on ${wedged.join(', ')} — jobs are queued but nothing is processing them.`,
          detail,
        };
      }
      // Deliberately NOT flagged on the failed count: Bull keeps failed jobs in the
      // set indefinitely, so it is a lifetime total, not a current-health signal —
      // any threshold on it eventually sticks red forever and trains the operator
      // to ignore this page. Recent failures are covered by the time-bounded
      // "Failed ingests (24h)" and "Failed media generations (24h)" checks instead.
      return {
        status: 'ok' as const,
        message: `All 10 queues responsive · ${totalWaiting} waiting, ${totalActive} active${totalFailed > 0 ? ` · ${totalFailed} failed all-time (see the 24h checks for recent failures)` : ''}.`,
        detail,
      };
    },
  },
  {
    id: 'stuck-media-claims',
    group: 'jobs',
    label: 'Orphaned in-flight jobs',
    deep: false,
    timeoutMs: 6000,
    timeoutStatus: 'degraded',
    remediation:
      'Click "Reconcile stuck jobs" above — it flips orphaned claims to FAILED so they become retryable. Then retry the items from Admin → Content or the tutor UI. A `docker compose restart api` also runs the reconciler at boot.',
    run: async () => {
      // Rows left mid-generation by a crashed/restarted worker: the learner sees a
      // spinner forever and the retry button stays disabled until status is FAILED.
      const cutoff = new Date(Date.now() - STUCK_AFTER_MINUTES * 60 * 1000);
      const [content, podcasts, videos, decks, flashcards, banks] = await Promise.all([
        prisma.content.count({ where: { status: 'PROCESSING', updatedAt: { lt: cutoff } } }),
        prisma.podcast.count({ where: { status: 'GENERATING', updatedAt: { lt: cutoff } } }),
        prisma.contentVideo.count({ where: { status: 'GENERATING', updatedAt: { lt: cutoff } } }),
        prisma.contentSlideDeck.count({ where: { status: 'GENERATING', updatedAt: { lt: cutoff } } }),
        prisma.flashcardDeck.count({ where: { status: 'GENERATING', updatedAt: { lt: cutoff } } }),
        prisma.questionBank.count({ where: { generationStatus: 'GENERATING', updatedAt: { lt: cutoff } } }),
      ]);

      const total = content + podcasts + videos + decks + flashcards + banks;
      const detail = {
        content,
        podcasts,
        videos,
        slideDecks: decks,
        flashcardDecks: flashcards,
        questionBanks: banks,
        olderThanMinutes: STUCK_AFTER_MINUTES,
      };

      if (total > 0) {
        const parts = [
          content ? `${content} content` : null,
          podcasts ? `${podcasts} podcast` : null,
          videos ? `${videos} video` : null,
          decks ? `${decks} slide deck` : null,
          flashcards ? `${flashcards} flashcard deck` : null,
          banks ? `${banks} question bank` : null,
        ].filter(Boolean);
        return {
          status: 'degraded' as const,
          message: `${total} item(s) stuck mid-generation for over ${STUCK_AFTER_MINUTES} minutes (${parts.join(', ')}). Users see a spinner that never resolves.`,
          detail,
        };
      }
      return { status: 'ok' as const, message: 'No orphaned in-flight jobs.', detail };
    },
  },
];
