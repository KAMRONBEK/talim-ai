import Bull from 'bull';
import { env } from '../config/env.js';

export const contentQueue = new Bull('process-content', env.REDIS_URL);
export const quizQueue = new Bull('generate-quiz', env.REDIS_URL);
export const podcastQueue = new Bull('generate-podcast', env.REDIS_URL);

export interface ProcessContentJobData {
  contentId: string;
}

export interface GenerateQuizJobData {
  contentId: string;
  userId: string;
  quizId: string;
}

export interface GeneratePodcastJobData {
  contentId: string;
  podcastId: string;
}

type ContentScopedJobData = { contentId?: string };

const CONTENT_QUEUES = [contentQueue, quizQueue, podcastQueue] as const;

export async function cancelContentJobs(contentId: string): Promise<void> {
  const states: Bull.JobStatus[] = ['waiting', 'active', 'delayed'];
  for (const queue of CONTENT_QUEUES) {
    const jobs = await queue.getJobs(states);
    await Promise.all(
      jobs
        .filter((job) => (job.data as ContentScopedJobData).contentId === contentId)
        .map((job) => job.remove()),
    );
  }
}
