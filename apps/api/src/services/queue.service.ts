import Bull from 'bull';
import { env } from '../config/env.js';
import { storageService } from './storage.service.js';

export const contentQueue = new Bull('process-content', env.REDIS_URL);
export const reparseQueue = new Bull('reparse-content', env.REDIS_URL);
export const quizQueue = new Bull('generate-quiz', env.REDIS_URL);
export const podcastQueue = new Bull('generate-podcast', env.REDIS_URL);
export const videoQueue = new Bull('generate-video', env.REDIS_URL);
export const flashcardQueue = new Bull('generate-flashcards', env.REDIS_URL);
export const slidesQueue = new Bull('generate-slides', env.REDIS_URL);
export const manimQueue = new Bull('render-manim', env.REDIS_URL);
export const bankQuestionsQueue = new Bull('generate-bank-questions', env.REDIS_URL);
export const transcriptQueue = new Bull('backfill-transcript', env.REDIS_URL);

export interface ProcessContentJobData {
  contentId: string;
}

export interface ReparseContentJobData {
  contentId: string;
  /** Requesting user (owner or tenant owner) — decides the deck-pre-gen role. */
  userId: string;
  /**
   * Storage key of the staged page-image JSON (string[] of data URLs). The images
   * are far too big for a Redis job payload, so the controller persists them via
   * storageService and the job loads + deletes them.
   */
  pagesStorageKey: string;
}

export interface GenerateQuizJobData {
  contentId: string;
  userId: string;
  quizId: string;
  sectionId?: string;
  kind?: 'FULL' | 'QUICK';
  // Legacy single-style knob (used when `types` is absent).
  style?: 'mixed' | 'multipleChoice' | 'trueFalse' | 'written' | 'numeric';
  count?: number;
  // Unified generator params: explicit question-type set + cognitive depth.
  types?: string[];
  depth?: 'recall' | 'understanding' | 'application' | 'mixed';
  locale?: string;
}

export interface GeneratePodcastJobData {
  contentId: string;
  podcastId: string;
  locale?: string;
  /** When set, (re)generate ONLY this one episode (manual per-section trigger). */
  episodeId?: string;
}

export interface GenerateVideoJobData {
  contentId: string;
  videoId: string;
  locale?: string;
}

export interface GenerateFlashcardsJobData {
  contentId: string;
  deckId: string;
  locale?: string;
  /** Requested card count (Practice dialog); defaults to the job's TARGET_CARDS. */
  count?: number;
}

export interface GenerateSlidesJobData {
  contentId: string;
  /** Requesting user — generation usage is metered against them (and their tenant). */
  userId: string;
  tenantId?: string | null;
  /** Content title, used as the deck-title fallback in the prompt. */
  title: string;
  locale?: string;
  audience?: 'kids' | 'students' | 'tutors';
  /** When set, generate a per-section deck (manual per-part generate/retry). */
  sectionId?: string;
}

export interface GenerateBankQuestionsJobData {
  bankId: string;
  tenantId: string;
  /** Requesting tutor — generation usage is metered against them (QUESTION_DRAFT). */
  userId: string;
  /** The request body, already validated by `generateSchema` at enqueue time. */
  input: {
    topic?: string;
    contentId?: string;
    sectionId?: string;
    count: number;
    style: string;
    types?: string[];
    depth: string;
  };
}

export interface BackfillTranscriptJobData {
  contentId: string;
  /** Requesting user — AI-transcription usage is metered against them (and their tenant). */
  userId: string;
  tenantId?: string | null;
}

export interface RenderManimJobData {
  jobId: string;
  script: string;
  messageId: string;
  storagePath?: string;
  status?: 'pending' | 'ready' | 'failed';
}

type ContentScopedJobData = { contentId?: string };

const CONTENT_QUEUES = [
  contentQueue,
  reparseQueue,
  quizQueue,
  podcastQueue,
  videoQueue,
  flashcardQueue,
  slidesQueue,
  transcriptQueue,
] as const;

export async function cancelContentJobs(contentId: string): Promise<void> {
  const states: Bull.JobStatus[] = ['waiting', 'active', 'delayed'];
  for (const queue of CONTENT_QUEUES) {
    const jobs = await queue.getJobs(states);
    await Promise.all(
      jobs
        .filter((job) => (job.data as ContentScopedJobData).contentId === contentId)
        // An ACTIVE (currently-running) job is locked by its worker, so Bull
        // rejects job.remove() with "Could not remove job …". That must not fail
        // the caller (e.g. deleting a material that is still processing) — skip
        // the locked job; it finishes on its own and its writes to the now-deleted
        // content are handled by the processor. Waiting/delayed jobs are removed.
        .map(async (job) => {
          const removed = await job
            .remove()
            .then(() => true)
            .catch(() => false);
          // A cancelled (never-run) reparse job leaves its staged page images
          // behind — its finally-block cleanup never executes — so drop the blob
          // here. Active jobs keep it; they delete it themselves when they finish.
          const pagesStorageKey = (job.data as Partial<ReparseContentJobData>).pagesStorageKey;
          if (removed && pagesStorageKey) {
            await Promise.resolve(storageService.delete(pagesStorageKey)).catch(() => undefined);
          }
        }),
    );
  }
}
