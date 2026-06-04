export type ContentType = 'PDF' | 'YOUTUBE' | 'SLIDE';
export type ContentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
export type MessageRole = 'USER' | 'ASSISTANT';
export type PodcastStatus = 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';

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

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
