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
