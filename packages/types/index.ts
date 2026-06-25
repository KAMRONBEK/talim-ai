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
export type TenantMemberRole = 'OWNER' | 'LEARNER';
export type QuestionType = 'SHORT_ANSWER' | 'NUMERIC' | 'MULTIPLE_CHOICE';

export type QuestionStyle = 'mixed' | 'multipleChoice' | 'trueFalse' | 'written' | 'numeric';
export type BankQuestionStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';
export type TenantAssessmentStatus = 'DRAFT' | 'PUBLISHED';
export type AssessmentAttemptStatus = 'SUBMITTED' | 'GRADED';

export type PlanKind = 'INDIVIDUAL' | 'TENANT';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';
export type SubscriptionSource = 'ADMIN' | 'PAYMENT_PROVIDER';
export type PlanCode = 'FREE' | 'INDIVIDUAL_PRO' | 'TENANT_STARTER' | 'TENANT_GROWTH';

export interface PlanLimits {
  maxUploads?: number | null;
  maxGenerationsPerMonth?: number | null;
  maxTutorMessages?: number | null;
  maxStudents?: number | null;
  maxContentItems?: number | null;
}

export interface AdminUserSubscription {
  id: string;
  planCode: string;
  planName: string;
  planKind: PlanKind;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  externalSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  limits: PlanLimits;
  effectivePlanCode: string;
}

export interface AdminSubscriptionListItemUser extends AdminUserSubscription {
  subjectType: 'user';
  userId: string;
  userEmail: string;
  userName: string | null;
}

export interface AdminSubscriptionListItemTenant extends AdminUserSubscription {
  subjectType: 'tenant';
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

export type AdminSubscriptionListItem =
  | AdminSubscriptionListItemUser
  | AdminSubscriptionListItemTenant;

export interface AdminUsageVsLimits {
  periodStart: string;
  periodEnd: string;
  uploads: { used: number; limit: number | null };
  generations: { used: number; limit: number | null };
  tutorMessages: { used: number; limit: number | null };
  apiCostUsd: number;
}

export interface AdminTenantUsageVsLimits extends AdminUsageVsLimits {
  students: { used: number; limit: number | null };
  contentItems: { used: number; limit: number | null };
  subscription?: AdminUserSubscription | null;
}

export type QuotaFeature = 'UPLOAD' | 'GENERATION' | 'TUTOR_MESSAGE' | 'STUDENT';

export interface QuotaExceededResponse {
  message: string;
  code: 'QUOTA_EXCEEDED';
  feature: QuotaFeature;
  used: number;
  limit: number;
  upgradePlanCode: PlanCode | null;
}

export interface AdminUpdateSubscriptionInput {
  planCode?: PlanCode;
  status?: SubscriptionStatus;
  currentPeriodEnd?: string | null;
  seatLimit?: number | null;
}

export type UserSubscription = AdminUserSubscription;

export interface BillingUsageVsLimits {
  uploads: { used: number; limit: number | null };
  generations: { used: number; limit: number | null };
  tutorMessages: { used: number; limit: number | null };
}

export interface TenantBillingUsageVsLimits extends BillingUsageVsLimits {
  students: { used: number; limit: number | null };
  contentItems: { used: number; limit: number | null };
}

export interface BillingMeResponse {
  subscription: UserSubscription;
  usage: BillingUsageVsLimits | TenantBillingUsageVsLimits;
  periodStart: string;
  periodEnd: string;
  tenantId?: string | null;
}

export interface CreateTenantStudentResponse {
  student: TenantStudent;
  temporaryPassword: string;
}

export type UsageFeature =
  | 'EMBED'
  | 'TUTOR_CHAT'
  | 'QUIZ_GEN'
  | 'QUESTION_DRAFT'
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
  username?: string | null;
  name: string | null;
  role: UserRole;
  mustChangePassword?: boolean;
  preferredLocale: AppLocale;
  tenantId: string | null;
  tenantName?: string | null;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  seatLimit: number | null;
  joinCode: string | null;
  createdAt: string;
}

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantMemberRole;
  active: boolean;
  joinedAt: string;
}

export interface ContentAssignment {
  id: string;
  contentId: string;
  learnerId: string;
  assignedById: string;
  assignedAt: string;
}

export interface TenantStudent {
  id: string;
  email: string | null;
  username: string | null;
  name: string | null;
  active: boolean;
  joinedAt: string;
  assignedCount: number;
  lastActivityAt: string | null;
  avgQuizScore: number | null;
}

export interface StudentContentProgress {
  contentId: string;
  contentTitle: string;
  overallCoverage: number;
  lastActivityAt: string | null;
  quizAttempts: number;
  avgQuizScore: number | null;
}

export interface StudentProgressSummary {
  student: Pick<TenantStudent, 'id' | 'email' | 'name' | 'active'>;
  activityDays: string[];
  streakDays: number;
  contentProgress: StudentContentProgress[];
}

export interface TenantProgressSummary {
  totals: {
    students: number;
    activeStudents: number;
    materials: number;
    avgCoverage: number;
    avgQuizScore: number | null;
  };
  students: TenantStudent[];
}

export interface LearnerSummary {
  tenantName: string | null;
  assignedCount: number;
  streakDays: number;
  avgQuizScore: number | null;
  lastActivityAt: string | null;
  continueContent: {
    contentId: string;
    title: string;
    lastSectionId: string | null;
    overallCoverage: number;
  } | null;
}

export interface QuestionBank {
  id: string;
  tenantId: string;
  title: string;
  topic: string | null;
  createdById: string;
  createdAt: string;
  questionCount: number;
  approvedCount: number;
}

export interface BankQuestion {
  id: string;
  bankId: string;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  acceptableAnswers: string[];
  explanation: string | null;
  status: BankQuestionStatus;
  sourceContentId: string | null;
  sourceSectionId: string | null;
  createdAt: string;
}

export type AssessmentMode = 'WRITTEN' | 'GAME';

export interface TenantAssessment {
  id: string;
  tenantId: string;
  bankId: string | null;
  title: string;
  instructions: string | null;
  maxAttempts: number;
  mode: AssessmentMode;
  secondsPerQuestion: number | null;
  status: TenantAssessmentStatus;
  createdAt: string;
  questionCount: number;
  assignmentCount: number;
}

export interface AssessmentAssignment {
  id: string;
  assessmentId: string;
  learnerId: string | null;
  contentId: string | null;
  sectionId: string | null;
  assignedById: string;
  assignedAt: string;
}

export interface LearnerAssessment {
  id: string;
  title: string;
  instructions: string | null;
  maxAttempts: number;
  mode: AssessmentMode;
  secondsPerQuestion: number | null;
  attemptCount: number;
  latestScore: number | null;
  latestPoints: number | null;
  questions: Array<{
    id: string;
    type: QuestionType;
    prompt: string;
    options: string[] | null;
  }>;
}

export interface AssessmentQuestionResult {
  questionId: string;
  correct: boolean;
  submittedAnswer: string;
  acceptableAnswers: string[];
  explanation: string | null;
  pointsAwarded: number;
}

export interface AssessmentSubmitResult {
  attempt: {
    id: string;
    assessmentId: string;
    score: number;
    pointsTotal: number;
    maxStreak: number;
    status: string;
    submittedAt: string;
  };
  correct: number;
  total: number;
  results: AssessmentQuestionResult[];
}

export interface AssessmentLeaderboardRow {
  rank: number;
  learnerId: string;
  learnerName: string;
  pointsTotal: number;
  score: number;
  maxStreak: number;
}

export interface AssessmentLeaderboard {
  assessmentId: string;
  mode: AssessmentMode;
  title: string;
  rows: AssessmentLeaderboardRow[];
}

export interface AssessmentResultLearner {
  learnerId: string;
  learnerName: string;
  attempts: number;
  submitted: boolean;
  bestScore: number | null;
  bestPoints: number;
  maxStreak: number;
}

export interface AssessmentResults {
  assessmentId: string;
  mode: AssessmentMode;
  title: string;
  questionCount: number;
  learners: AssessmentResultLearner[];
}

export interface AdminUserListItem extends User {
  adminPasswordNote: string | null;
  contentCount: number;
  lastActivityAt: string | null;
  planCode: string | null;
  subscriptionStatus: SubscriptionStatus | null;
}

export interface AdminUserDetail extends AdminUserListItem {
  quizCount: number;
  summaryCount: number;
  usageLast30Days: number;
  ownedTenant: Pick<Tenant, 'id' | 'name' | 'slug'> | null;
  learnerTenant: Pick<Tenant, 'id' | 'name' | 'slug'> | null;
}

export interface AdminTenantListItem extends Tenant {
  ownerEmail: string;
  ownerName: string | null;
  studentCount: number;
  contentCount: number;
  planCode: string | null;
  subscriptionStatus: SubscriptionStatus | null;
}

export interface AdminTenantMember {
  membershipId: string;
  userId: string;
  email: string;
  name: string | null;
  userRole: UserRole;
  memberRole: TenantMemberRole;
  active: boolean;
  joinedAt: string;
}

export interface AdminTenantDetail extends Tenant {
  owner: Pick<User, 'id' | 'email' | 'name'>;
  studentCount: number;
  contentCount: number;
  members: AdminTenantMember[];
}

export type TutorRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TutorRequest {
  id: string;
  userId: string;
  orgName: string;
  note: string | null;
  status: TutorRequestStatus;
  decidedAt: string | null;
  createdAt: string;
}

export interface AdminTutorRequest extends TutorRequest {
  userEmail: string;
  userName: string | null;
  userRole: UserRole;
}

export interface AdminAuditLogItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: string;
  adminEmail: string;
  adminName: string | null;
}

export interface AdminPatchUserInput {
  name?: string;
  role?: UserRole;
  preferredLocale?: AppLocale;
  tenantId?: string;
  orgName?: string;
  newOwnerId?: string;
  adminPasswordNote?: string | null;
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

export interface UsageFeatureStats {
  count: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface UserUsageSummary {
  periodStart: string;
  periodEnd: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  eventCount: number;
  byFeature: Partial<Record<UsageFeature, UsageFeatureStats>>;
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
  tenantId?: string | null;
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
  type: QuestionType;
  /** Present only for MULTIPLE_CHOICE; null for SHORT_ANSWER / NUMERIC. */
  options: string[] | null;
  correctAnswer: string;
  acceptableAnswers: string[];
  explanation: string | null;
}

export interface Quiz {
  id: string;
  contentId: string;
  userId: string;
  sectionId: string | null;
  kind: QuizKind;
  style: QuestionStyle;
  count: number | null;
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

export type {
  DeckAccent,
  DeckIcon,
  DeckAudience,
  SlideLayout,
  SlideBase,
  DeckBullet,
  CoverSlide,
  SectionSlide,
  ConceptSlide,
  BulletsSlide,
  TwoColumnSlide,
  BigStatSlide,
  StatTrioSlide,
  QuoteSlide,
  DefinitionSlide,
  ComparisonSlide,
  ProcessSlide,
  DiagramSlide,
  ChartSlide,
  CalloutSlide,
  RecapSlide,
  QuickCheckSlide,
  DeckSlide,
  Deck,
  SlideDeckStatus,
  ContentSlideDeck,
} from './deck';
