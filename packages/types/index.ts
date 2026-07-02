import type { AppLocale } from './locale';

export type { JobEvent, SeqJobEvent, JobEventStatus } from './jobEvents';

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
export type QuestionType =
  | 'SHORT_ANSWER'
  | 'NUMERIC'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'MULTIPLE_SELECT'
  | 'FILL_BLANK'
  | 'DROPDOWN_CLOZE'
  | 'MATCHING'
  | 'ORDERING'
  | 'HOTSPOT'
  | 'DRAG_DROP';

export type QuestionStyle = 'mixed' | 'multipleChoice' | 'trueFalse' | 'written' | 'numeric';
export type BankQuestionStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';
export type TenantAssessmentStatus = 'DRAFT' | 'PUBLISHED';
export type AssessmentAttemptStatus = 'SUBMITTED' | 'GRADED';

export type PlanKind = 'INDIVIDUAL' | 'TENANT';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';
export type SubscriptionSource = 'ADMIN' | 'PAYMENT_PROVIDER';
export type PlanCode = 'FREE' | 'INDIVIDUAL_PRO' | 'TENANT_STARTER' | 'TENANT_GROWTH';

export interface PlanLimits {
  // Per-day allowances (reset at local midnight). null = unlimited.
  maxUploadsPerDay?: number | null;
  maxGenerationsPerDay?: number | null;
  maxPodcastsPerDay?: number | null;
  maxVideosPerDay?: number | null;
  maxTutorMessagesPerDay?: number | null;
  // Per-file upload gating.
  maxPagesPerFile?: number | null;
  maxFileSizeMb?: number | null;
  // Tenant lifetime caps.
  maxStudents?: number | null;
  maxContentItems?: number | null;
  /** Monthly price in USD (0 for free plans). Manual billing — no payment gateway. */
  priceMonthlyUsd?: number | null;
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

export type QuotaFeature =
  | 'UPLOAD'
  | 'GENERATION'
  | 'TUTOR_MESSAGE'
  | 'VIDEO'
  | 'PODCAST'
  | 'STUDENT';

export interface QuotaExceededResponse {
  message: string;
  code: 'QUOTA_EXCEEDED';
  feature: QuotaFeature;
  used: number;
  limit: number;
  upgradePlanCode: PlanCode | null;
}

/** A file rejected at upload because it exceeds the plan's page/size caps. */
export interface PlanFileLimitResponse {
  message: string;
  code: 'PLAN_FILE_LIMIT';
  maxPages: number | null;
  maxFileSizeMb: number | null;
  pages: number | null;
  fileSizeMb: number | null;
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
  videos?: { used: number; limit: number | null };
  podcasts?: { used: number; limit: number | null };
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

// --- Student CSV / bulk import (Wave 3 area D) ------------------------------

export type StudentImportResult =
  | 'created'
  | 'reactivated'
  | 'skipped_duplicate'
  | 'error_seat_limit'
  | 'error';

/** One row's outcome from POST /tenant/students/import. */
export interface StudentImportRow {
  /** 1-based row number in the submitted CSV / rows list. */
  row: number;
  name: string;
  result: StudentImportResult;
  /** Failure reason (errors / skips) or an informational note. */
  message?: string;
  /** Resolved username (present for created/reactivated username-only students). */
  username?: string | null;
  /** Real email for email students; null for username-only students. */
  email?: string | null;
  /** Auto-generated temporary password (created/reactivated rows) — shown once to the tutor. */
  temporaryPassword?: string;
}

export interface StudentImportSummary {
  total: number;
  created: number;
  reactivated: number;
  /** Rows skipped because the student is already an active member. */
  skipped: number;
  /** Rows rejected because the seat limit was reached (partial import). */
  seatLimited: number;
  errors: number;
}

export interface StudentImportResponse {
  report: StudentImportRow[];
  summary: StudentImportSummary;
}

// --- Tenant messaging (tutor ↔ student, Wave 3 area D) ----------------------

export interface SendTenantMessageInput {
  studentIds: string[];
  body: string;
}

/** A tutor's sent message with delivery/read counts. */
export interface TenantSentMessage {
  id: string;
  body: string;
  createdAt: string;
  recipientCount: number;
  readCount: number;
}

export interface SendTenantMessageResponse {
  message: TenantSentMessage;
}

/**
 * One message inside a tutor's thread, as seen by the tutor. A thread interleaves student
 * replies (`fromTutor: false`, `readAt` = the owner's read timestamp) with the owner's own
 * in-thread responses (`fromTutor: true`, `readAt` always null — the owner isn't a recipient).
 */
export interface TenantMessageReply {
  id: string;
  threadId: string;
  body: string;
  senderName: string | null;
  fromTutor: boolean;
  createdAt: string;
  readAt: string | null;
}

/** A tutor's root message grouped with its student replies (superset of TenantSentMessage). */
export interface TenantMessageThread extends TenantSentMessage {
  replyCount: number;
  unreadReplyCount: number;
  replies: TenantMessageReply[];
}

export interface TenantSentMessagesResponse {
  messages: TenantMessageThread[];
}

/** Unread student-reply count for the tutor (polling badge). */
export interface TenantUnreadReplyCountResponse {
  count: number;
}

/** A single message within a two-way thread, as shown to a student. */
export interface LearnerThreadMessage {
  id: string;
  threadId: string;
  body: string;
  senderName: string | null;
  fromTutor: boolean;
  createdAt: string;
}

/** A message as seen by the receiving student, with its full thread (root + replies). */
export interface LearnerMessage {
  id: string;
  body: string;
  senderName: string | null;
  createdAt: string;
  readAt: string | null;
  thread: LearnerThreadMessage[];
}

export interface LearnerMessagesResponse {
  messages: LearnerMessage[];
}

export interface LearnerUnreadCountResponse {
  count: number;
}

export interface MarkMessageReadResponse {
  id: string;
  readAt: string | null;
}

export interface CreateLearnerReplyResponse {
  reply: LearnerThreadMessage;
}

/** A tutor's in-thread response to a specific student reply (POST /tenant/messages/:id/respond). */
export interface TenantResponseMessage {
  id: string;
  threadId: string;
  body: string;
  senderName: string | null;
  fromTutor: true;
  createdAt: string;
}

export interface RespondToReplyResponse {
  reply: TenantResponseMessage;
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
  | 'VIDEO_GEN'
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
  /** Avg overall coverage across the student's tenant content (0-100); null if no progress yet. */
  mastery: number | null;
}

export interface StudentContentProgress {
  contentId: string;
  contentTitle: string;
  overallCoverage: number;
  lastActivityAt: string | null;
  quizAttempts: number;
  avgQuizScore: number | null;
}

/** One topic's (= content section's) mastery, 0-100. */
export interface MasteryTopic {
  sectionId: string;
  title: string;
  coverage: number;
}

/** An achievement badge; `progress` (0..1) is present only while unearned. */
export interface Badge {
  code: string;
  label: string;
  emoji: string;
  earned: boolean;
  progress?: number;
}

/** Per-student overall-mastery buckets for a class. */
export interface ClassMasteryDistribution {
  lt50: number;
  b50_69: number;
  b70_84: number;
  gte85: number;
}

export interface ClassMastery {
  byTopic: MasteryTopic[];
  distribution: ClassMasteryDistribution;
}

export interface StudentProgressSummary {
  student: Pick<TenantStudent, 'id' | 'email' | 'name' | 'active'>;
  activityDays: string[];
  streakDays: number;
  contentProgress: StudentContentProgress[];
  masteryByTopic: MasteryTopic[];
  badges: Badge[];
}

export interface TenantProgressSummary {
  totals: {
    students: number;
    activeStudents: number;
    materials: number;
    avgCoverage: number;
    avgQuizScore: number | null;
    /** Active students flagged low-mastery (<50) or stale (no activity in 14 days). */
    atRisk: number;
  };
  students: TenantStudent[];
  classMastery: ClassMastery;
}

export type LearnerMaterialStatus = 'not_started' | 'in_progress' | 'completed';

/** A learner's assigned material with per-material progress. */
export interface LearnerMaterial {
  contentId: string;
  title: string;
  type: ContentType;
  coverage: number;
  status: LearnerMaterialStatus;
  lastActivityAt: string | null;
}

/** The learner's own consolidated progress dashboard. */
export interface LearnerProgress {
  overallMastery: number;
  streakDays: number;
  materialsDone: number;
  quizzesTaken: number;
  avgAccuracy: number | null;
  masteryByTopic: MasteryTopic[];
  badges: Badge[];
  activityDays: string[];
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

export interface QuestionBankMaterial {
  id: string;
  title: string;
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
  /** Materials (Content) this bank is about. */
  materials: QuestionBankMaterial[];
}

export interface BankQuestion {
  id: string;
  bankId: string;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  acceptableAnswers: string[];
  /**
   * Extra per-type configuration. Present for FILL_BLANK (`{ blanks?: number;
   * blankAnswers?: string[][] }`); null for types that don't need it.
   */
  config: Record<string, unknown> | null;
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
  /** When true, per-question weighted points with a wrong-answer penalty are used. */
  strictScoring: boolean;
  /** Fraction of a question's points deducted for a wrong (answered) response under strict scoring. */
  wrongPenalty: number;
  /** When true, MULTIPLE_SELECT / FILL_BLANK award partial credit; otherwise all-or-nothing. */
  partialCredit: boolean;
  /** Scheduled start (ISO) for a live game — drives the "starts soon" banner. Null if unscheduled. */
  scheduledAt: string | null;
  /** True while a live game session is open. */
  isLive: boolean;
  /** When the live session auto-closes (ISO); null = open until manually ended. */
  liveEndsAt: string | null;
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
  /** Soft due date (ISO). Informational only — does not block submission. */
  dueAt: string | null;
}

export interface LearnerAssessment {
  id: string;
  title: string;
  instructions: string | null;
  maxAttempts: number;
  mode: AssessmentMode;
  secondsPerQuestion: number | null;
  /** Scheduled start (ISO) for a live game — drives the "starts soon" banner. Null if unscheduled. */
  scheduledAt: string | null;
  /** True while a live game session is open (frontend polls the leaderboard during it). */
  isLive: boolean;
  /** When the live session auto-closes (ISO); null = open until manually ended. */
  liveEndsAt: string | null;
  /** Soft due date (ISO) — earliest across the learner's assignments, or null. */
  dueAt: string | null;
  attemptCount: number;
  latestScore: number | null;
  latestPoints: number | null;
  questions: Array<{
    id: string;
    type: QuestionType;
    prompt: string;
    options: string[] | null;
    /** Per-type config (e.g. FILL_BLANK blank count); null when not applicable. */
    config: Record<string, unknown> | null;
  }>;
}

export interface AssessmentQuestionResult {
  questionId: string;
  correct: boolean;
  submittedAnswer: string;
  acceptableAnswers: string[];
  explanation: string | null;
  pointsAwarded: number;
  /** Strict-scoring only: 0..1 credit for this answer (null under legacy percentage scoring). */
  creditFraction?: number | null;
  /** Strict-scoring only: signed points earned for this answer (null under legacy scoring). */
  pointsEarned?: number | null;
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
    /** Strict-scoring only: signed total points earned (null under legacy scoring). */
    pointsEarned?: number | null;
    /** Strict-scoring only: maximum attainable points (null under legacy scoring). */
    maxPoints?: number | null;
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
  /** Soft due date (ISO) for this learner's assignment, or null. */
  dueAt: string | null;
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

export type MediaReviewStatus = 'PENDING' | 'APPROVED' | 'FLAGGED';

export interface AdminGeneratedItem {
  id: string;
  kind: 'podcast' | 'quiz' | 'slideshow' | 'summary';
  contentId: string;
  contentTitle: string;
  userId: string;
  userEmail: string;
  status?: string;
  createdAt: string;
  /** Admin review verdict for this generated item; PENDING when never reviewed. */
  reviewStatus: MediaReviewStatus;
}

export interface AdminGeneratedListResponse {
  items: AdminGeneratedItem[];
}

/** One generated-media review row (approve/flag), keyed by (kind, mediaId). */
export interface AdminGeneratedReview {
  kind: string;
  mediaId: string;
  status: MediaReviewStatus;
  note: string | null;
  reviewedById: string | null;
  updatedAt: string;
}

export interface AdminGeneratedReviewResponse {
  review: AdminGeneratedReview;
}

export interface AdminImpersonateResponse {
  /** Short-lived (30 min) stateless JWT for the impersonated user. */
  token: string;
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

// --- Admin analytics dashboard (read-only) ---------------------------------

/** Top-line KPIs for the admin analytics dashboard. */
export interface AdminAnalyticsSummary {
  users: number;
  /** Distinct users with a LearningActivityDay in the last 30 days. */
  active30d: number;
  orgs: number;
  content: number;
  /** QuizAttempt + AssessmentAttempt rows across the platform. */
  quizzesTaken: number;
  mrrUsd: number;
}

export interface AdminMrrPlanBreakdown {
  planCode: string;
  planName: string;
  planKind: PlanKind;
  activeSubscriptions: number;
  priceMonthlyUsd: number;
  mrrUsd: number;
}

/** MRR = sum of effective plan price over ACTIVE subscriptions. */
export interface AdminMrrResponse {
  mrrUsd: number;
  activeSubscriptions: number;
  byPlan: AdminMrrPlanBreakdown[];
}

export interface AdminUserGrowthPoint {
  /** Month bucket as YYYY-MM (UTC). */
  month: string;
  newUsers: number;
  /** Cumulative total users through the end of this month. */
  totalUsers: number;
}

export interface AdminUserGrowthResponse {
  points: AdminUserGrowthPoint[];
}

export interface AdminUsersByRoleRow {
  role: UserRole;
  count: number;
}

export interface AdminUsersByRoleResponse {
  roles: AdminUsersByRoleRow[];
}

/** registered → activated (>=1 content) → tutor (TENANT_OWNER) → paid (active non-FREE sub). */
export interface AdminFunnelResponse {
  registered: number;
  activated: number;
  tutors: number;
  paid: number;
}

export interface AdminContentByTypeRow {
  type: ContentType;
  count: number;
}

export interface AdminContentByTypeResponse {
  types: AdminContentByTypeRow[];
}

export interface AdminTopOrg {
  tenantId: string;
  name: string;
  slug: string;
  studentCount: number;
  contentCount: number;
  usageCostUsd: number;
  planCode: string | null;
}

export interface AdminTopOrgsResponse {
  orgs: AdminTopOrg[];
}

export interface AdminSpendByModelRow {
  model: string;
  eventCount: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  /** True when costUsd was derived from tokens × pricing rather than stored. */
  approximated: boolean;
}

export interface AdminSpendByModelResponse {
  rows: AdminSpendByModelRow[];
  totalCostUsd: number;
  /** True when any row's cost was approximated from tokens × the pricing table. */
  approximated: boolean;
}

// --- Admin content-control detail (read-only inspector) --------------------

export interface AdminContentDetailContent {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  tenantId: string | null;
  type: ContentType;
  title: string;
  url: string | null;
  storagePath: string | null;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContentDetailPipeline {
  textExtracted: boolean;
  chunked: boolean;
  sectioned: boolean;
  chunkCount: number;
  embeddedChunkCount: number;
  sectionCount: number;
}

export interface AdminContentDetailGenerated {
  summary: { present: boolean; count: number };
  podcast: { present: boolean; status: PodcastStatus | null };
  video: { present: boolean; status: GeneratedMediaStatus | null };
  quiz: { present: boolean; count: number };
}

/** A truncated chunk sample; the pgvector column is never returned, only tested. */
export interface AdminContentDetailChunk {
  chunkIndex: number;
  text: string;
  hasEmbedding: boolean;
}

export interface AdminContentDetail {
  content: AdminContentDetailContent;
  pipeline: AdminContentDetailPipeline;
  generated: AdminContentDetailGenerated;
  chunks: AdminContentDetailChunk[];
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
  /** Parent chapter's id when this is a subsection; null for top-level (flat = depth 0). */
  parentId: string | null;
  /** 0 = top-level chapter, 1 = subsection. Flat/legacy content is all depth 0. */
  depth: number;
  title: string;
  /** Global traversal order (parent, then its children, then next parent…) — a flat sort by order yields correct reading order. */
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
  /**
   * The TTS source script for this episode (dialogue lines). The client uses it
   * to derive an estimated, time-aligned transcript (segment start/end assigned
   * by cumulative character proportion × the audio's runtime duration) so the
   * player can highlight the roughly-current line and support click-to-seek.
   * Not word-accurate — a "following" transcript, not a captions track.
   */
  script: string;
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

/** One slide's narration clip in a generated narrated-slideshow video. */
export interface VideoSegment {
  index: number;
  title: string;
  narration: string;
  /** True once the TTS clip for this segment has been rendered and stored. */
  hasAudio: boolean;
  durationSec: number;
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
  segments: VideoSegment[] | null;
  createdAt: string;
}

/** Spaced-repetition grade a learner gives a card after flipping it. */
export type FlashcardGrade = 'again' | 'hard' | 'good' | 'easy';

/** Per-user SM-2 review state for a single flashcard. */
export interface FlashcardReviewState {
  flashcardId: string;
  intervalDays: number;
  nextReviewAt: string | null;
  repetitions: number;
  easeFactor: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  order: number;
  // SRS review state for the requesting user (additive; always present on GET responses).
  due: boolean;
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  nextReviewAt: string | null;
}

export interface FlashcardDeck {
  id: string;
  contentId: string;
  locale: AppLocale;
  sectionId: string | null;
  scopeKey: string;
  status: GeneratedMediaStatus;
  cards: Flashcard[];
  /** Number of cards due for review now for the requesting user. */
  dueCount: number;
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
