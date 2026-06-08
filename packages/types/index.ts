import type { AppLocale } from './locale';

export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  isAppLocale,
  parseAppLocale,
  type AppLocale,
} from './locale';

export type ContentType = 'PDF' | 'YOUTUBE' | 'SLIDE';
export type GeneratedMediaStatus = 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';
export type ContentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
export type MessageRole = 'USER' | 'ASSISTANT';
export type PodcastStatus = 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';
export type QuizKind = 'FULL' | 'QUICK';
export type TranscriptSource = 'YOUTUBE_CAPTIONS' | 'AI_TRANSCRIPTION';
export type UserRole = 'INDIVIDUAL' | 'TENANT_OWNER' | 'TENANT_LEARNER' | 'ADMIN';

export type UsageFeature =
  | 'EMBED'
  | 'TUTOR_CHAT'
  | 'QUIZ_GEN'
  | 'PODCAST_GEN'
  | 'SECTION_GEN'
  | 'SUMMARY_GEN'
  | 'SLIDESHOW_GEN'
  | 'TRANSCRIBE'
  | 'PDF_PARSE'
  | 'TENANT_ASSISTANT';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  preferredLocale: AppLocale;
  createdAt: string;
}

export interface AdminUserListItem extends User {
  contentCount: number;
  lastActivityAt: string | null;
}

export interface AdminUserDetail extends AdminUserListItem {
  quizCount: number;
  summaryCount: number;
  usageLast30Days: number;
}

export interface AdminContentItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  type: ContentType;
  title: string;
  status: ContentStatus;
  createdAt: string;
}

export interface AdminGeneratedItem {
  id: string;
  kind: 'podcast' | 'quiz' | 'slideshow' | 'summary';
  contentId: string;
  contentTitle: string;
  userId: string;
  userEmail: string;
  status?: string;
  createdAt: string;
}

export interface AdminUsageSummaryRow {
  userId: string;
  userEmail: string;
  userName: string | null;
  tenantId: string | null;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
  eventCount: number;
}

export interface AdminPlatformStats {
  totalUsers: number;
  signupsLast7Days: number;
  signupsLast30Days: number;
  totalContents: number;
  contentsByStatus: Record<ContentStatus, number>;
  totalQuizzes: number;
  totalPodcasts: number;
  totalSlideshows: number;
  totalSummaries: number;
  estimatedApiSpendUsd: number;
  activeUsersLast30Days: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
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

export interface TranscriptSegment {
  id: string;
  contentId: string;
  order: number;
  startMs: number;
  endMs: number;
  text: string;
  source: TranscriptSource;
}

export interface ContentTranscriptResponse {
  transcript: {
    contentId: string;
    source: TranscriptSource | null;
    durationMs: number | null;
    segments: TranscriptSegment[];
  };
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
  locale: AppLocale;
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
  excerpt?: string | null;
  excerptImage?: string | null;
  createdAt: string;
}

export interface ChatSessionResponse {
  sessionId: string | null;
  messages: ChatMessage[];
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
  locale: AppLocale;
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
  locale: AppLocale;
  summary: string;
  createdAt: string;
}

export interface ContentVideo {
  id: string;
  contentId: string;
  locale: AppLocale;
  sectionId: string | null;
  scopeKey: string;
  status: GeneratedMediaStatus;
  script: string | null;
  storagePath: string | null;
  durationSec: number | null;
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

export {
  GRAPH_FENCE_LANG,
  serializeGraphBlock,
  parseGraphBlock,
  type DesmosExpression,
  type DesmosSlider,
  type DesmosViewport,
  type DesmosGraphPayload,
} from './tutor-graph';

export {
  VISUAL_FENCE_LANG,
  serializeVisualBlock,
  parseVisualBlock,
  parseFenceBlock,
  serializeDesmosAsVisual,
  type VisualKind,
  type VisualBlock,
  type VisualPayloadMap,
  type MermaidPayload,
  type ChartPayload,
  type ChartSeries,
  type GeoGebraPayload,
  type ManimPayload,
  type HtmlSandboxPayload,
} from './tutor-visual';
