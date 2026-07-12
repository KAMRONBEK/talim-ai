import Bull from 'bull';
import { env } from '../config/env.js';

export const contentQueue = new Bull('process-content', env.REDIS_URL);
export const quizQueue = new Bull('generate-quiz', env.REDIS_URL);
export const podcastQueue = new Bull('generate-podcast', env.REDIS_URL);
export const videoQueue = new Bull('generate-video', env.REDIS_URL);
export const flashcardQueue = new Bull('generate-flashcards', env.REDIS_URL);
export const manimQueue = new Bull('render-manim', env.REDIS_URL);

export interface ProcessContentJobData {
  contentId: string;
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

export interface RenderManimJobData {
  jobId: string;
  script: string;
  messageId: string;
  storagePath?: string;
  status?: 'pending' | 'ready' | 'failed';
}

type ContentScopedJobData = { contentId?: string };

const CONTENT_QUEUES = [contentQueue, quizQueue, podcastQueue, videoQueue, flashcardQueue] as const;

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
        .map((job) => job.remove().catch(() => undefined)),
    );
  }
}
