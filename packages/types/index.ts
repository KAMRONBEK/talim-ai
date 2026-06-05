export type ContentType = 'PDF' | 'YOUTUBE' | 'SLIDE';
export type ContentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
export type MessageRole = 'USER' | 'ASSISTANT';
export type PodcastStatus = 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';
export type QuizKind = 'FULL' | 'QUICK';

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Content {
  id: string;
  userId: string;
  type: ContentType;
  title: string;
  url: string | null;
  storagePath: string | null;
  status: ContentStatus;
  createdAt: string;
}

export interface ContentSection {
  id: string;
  contentId: string;
  title: string;
  order: number;
  startChunk: number;
  endChunk: number;
  readMinutes: number | null;
}

export interface PodcastEpisode {
  id: string;
  podcastId: string;
  title: string;
  order: number;
  hasAudio: boolean;
  durationSec: number | null;
  sectionId: string | null;
}

export interface Podcast {
  id: string;
  contentId: string;
  status: PodcastStatus;
  episodes: PodcastEpisode[];
}

export interface PodcastEpisodeProgress {
  episodeId: string;
  listenedSec: number;
  completed: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  contentId: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  text: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
}

export interface Quiz {
  id: string;
  contentId: string;
  userId: string;
  sectionId: string | null;
  kind: QuizKind;
  createdAt: string;
  questions?: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  answers: Record<string, string>;
  createdAt: string;
}

export interface QuizWithLatestAttempt extends Quiz {
  latestAttempt: QuizAttempt | null;
  questionCount: number;
}

export interface ContentProgress {
  contentId: string;
  lastSectionId: string | null;
  overallCoverage: number;
  lastActivityAt: string;
}

export interface SectionProgress {
  sectionId: string;
  contentId: string;
  coverageScore: number;
  quizBestScore: number | null;
  quickCheckAccuracy: number | null;
  viewedAt: string | null;
  aiFeedback: string | null;
}

export interface ContentProgressResponse {
  contentProgress: ContentProgress | null;
  sections: Record<string, SectionProgress>;
}

export interface ContentSummary {
  id: string;
  contentId: string;
  sectionId: string | null;
  scopeKey: string;
  summary: string;
  createdAt: string;
}

export interface LearningHistory {
  quizzes: QuizWithLatestAttempt[];
  summaries: ContentSummary[];
  podcastStatus: PodcastStatus | null;
  streakDays: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export { isSelectedAnswerCorrect, resolveCorrectAnswer } from './quiz-answer';
