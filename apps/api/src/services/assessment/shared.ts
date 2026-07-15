import { z } from 'zod';
import { type BankQuestionStatus, type QuestionType } from '@prisma/client';
import { jsonStringArray, parseQuestionConfig } from '@talim/types';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { sampleChunksEvenly, MIN_SECTION_CONTEXT_CHARS } from '../../lib/chunk-sampling.js';
import { buildRagContext } from '../rag.service.js';

// The grading engine lives in @talim/types (shared with the web app for instant practice
// feedback). Re-exported here so the assessment services keep their original import surface.
export {
  jsonStringArray,
  parseQuestionConfig,
  answerToString,
  gradeQuestion,
  isAnswerableMultipleChoice,
  isAnswerableMultipleSelect,
} from '@talim/types';

export const createBankSchema = z.object({
  title: z.string().min(1),
  topic: z.string().min(1).optional(),
  // One or more materials (Content) this bank is about. Generated questions default to
  // drawing their context from these materials.
  contentIds: z.array(z.string().min(1)).optional(),
});

export const questionStyleEnum = z.enum([
  'mixed',
  'multipleChoice',
  'trueFalse',
  'multipleSelect',
  'fillBlank',
  'dropdownCloze',
  'matching',
  'ordering',
  'written',
  'numeric',
]);

export const questionDepthEnum = z.enum(['recall', 'understanding', 'application', 'mixed']);

export const generateSchema = z.object({
  topic: z.string().min(1).optional(),
  contentId: z.string().min(1).optional(),
  sectionId: z.string().min(1).optional(),
  count: z.number().int().min(1).max(30).default(10),
  // Legacy single-style knob: a balanced mix, or all of one kind. Ignored when `types` is set.
  style: questionStyleEnum.default('mixed'),
  // Preferred: explicit set of question types to generate (multi-select in the UI).
  types: z
    .array(
      z.enum([
        'SHORT_ANSWER',
        'NUMERIC',
        'MULTIPLE_CHOICE',
        'TRUE_FALSE',
        'MULTIPLE_SELECT',
        'FILL_BLANK',
        'DROPDOWN_CLOZE',
        'MATCHING',
        'ORDERING',
      ]),
    )
    .min(1)
    .optional(),
  // Cognitive depth: recall / understanding / application (near-transfer) or a mix.
  depth: questionDepthEnum.default('mixed'),
});

// Every question type the storage + scoring engine supports. Shared by the patch
// (edit/approve) and create (manual authoring) schemas so a tutor can hand-author or
// edit any type the AI generator can produce.
const questionTypeEnum = z.enum([
  'SHORT_ANSWER',
  'NUMERIC',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'MULTIPLE_SELECT',
  'FILL_BLANK',
  'DROPDOWN_CLOZE',
  'MATCHING',
  'ORDERING',
  'HOTSPOT',
  'DRAG_DROP',
]);

export const patchQuestionSchema = z
  .object({
    prompt: z.string().min(1).optional(),
    type: questionTypeEnum.optional(),
    options: z.array(z.string()).nullable().optional(),
    // HOTSPOT stores an empty list (its answer is the spatial config.regions), so we can't
    // require min(1) here as it would reject HOTSPOT content edits; the builders re-validate.
    acceptableAnswers: z.array(z.string()).optional(),
    config: z.record(z.string(), z.unknown()).nullable().optional(),
    explanation: z.string().nullable().optional(),
    status: z.enum(['DRAFT', 'APPROVED', 'REJECTED']).optional(),
  })
  .refine(
    (v) =>
      v.type === 'HOTSPOT' || v.acceptableAnswers === undefined || v.acceptableAnswers.length >= 1,
    {
      message: 'At least one acceptable answer is required.',
      path: ['acceptableAnswers'],
    },
  );

/**
 * Manual authoring of a bank question from scratch (not AI-generated). `prompt` and `type`
 * are always required; the structured types carry their left/right/blanks/blankOptions in
 * `config` (same shape the generator builders consume). Every type requires at least one
 * `acceptableAnswers` EXCEPT HOTSPOT, whose answer is spatial (the config.regions geometry)
 * so it stores an empty acceptableAnswers list.
 */
export const createQuestionSchema = z
  .object({
    prompt: z.string().min(1),
    type: questionTypeEnum,
    options: z.array(z.string()).nullable().optional(),
    acceptableAnswers: z.array(z.string()).default([]),
    config: z.record(z.string(), z.unknown()).nullable().optional(),
    explanation: z.string().nullable().optional(),
  })
  .refine((v) => v.type === 'HOTSPOT' || v.acceptableAnswers.length >= 1, {
    message: 'At least one acceptable answer is required.',
    path: ['acceptableAnswers'],
  });

export const createAssessmentSchema = z.object({
  bankId: z.string().min(1).optional(),
  title: z.string().min(1),
  instructions: z.string().optional(),
  maxAttempts: z.number().int().min(1).max(5).default(1),
  mode: z.enum(['WRITTEN', 'GAME']).default('WRITTEN'),
  secondsPerQuestion: z.number().int().min(5).max(120).optional(),
  questionIds: z.array(z.string()).min(1),
  publish: z.boolean().default(true),
  // Strict weighted scoring. OFF by default → today's percentage scoring is unchanged.
  strictScoring: z.boolean().default(false),
  // Fraction of a question's points deducted for a wrong (answered) response under strict scoring.
  wrongPenalty: z.number().min(0).max(1).default(0.5),
  // MULTIPLE_SELECT / FILL_BLANK award partial credit when true; all-or-nothing otherwise.
  partialCredit: z.boolean().default(true),
});

export const scheduleAssessmentSchema = z.object({
  // ISO date/time; null clears the schedule.
  scheduledAt: z.coerce.date().nullish(),
});

export const goLiveAssessmentSchema = z.object({
  // Defaults to going live; pass false to end the live session.
  live: z.boolean().optional(),
  // Optional auto-close time for the live window; null = open until manually ended.
  liveEndsAt: z.coerce.date().nullish(),
});

export const assignAssessmentSchema = z.object({
  learnerIds: z.array(z.string()).min(1),
  contentId: z.string().min(1).optional(),
  sectionId: z.string().min(1).optional(),
  // Due date — shown to the learner (display + overdue styling) AND enforced: submissions after
  // this instant are rejected with 403 in submitLearnerAssessment (services/assessment/learner.ts),
  // for both WRITTEN and GAME modes. A null dueAt never blocks.
  // Accepts an ISO date string (e.g. from an <input type="date">) and coerces to a Date.
  dueAt: z.coerce.date().nullish(),
});

/**
 * A single question's submitted answer. Back-compat: a plain string is the
 * original shape (SHORT_ANSWER / NUMERIC / MULTIPLE_CHOICE / TRUE_FALSE). The new
 * types send structured values — an array of option values (MULTIPLE_SELECT) or an
 * array/object of per-blank strings (FILL_BLANK). Structured values are persisted as
 * JSON.stringify(...) into the single AttemptAnswer.answer String column.
 */
export const submitAnswerValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.record(z.string(), z.string()),
]);

export const submitAssessmentSchema = z.object({
  answers: z.record(z.string(), submitAnswerValueSchema),
  // Per-question elapsed time (ms) and total duration, used for GAME scoring.
  timings: z.record(z.string(), z.number().int().min(0)).optional(),
  durationMs: z.number().int().min(0).optional(),
});

const GAME_BASE_POINTS = 1000;

/** Speed-weighted, streak-multiplied points for a correct game-quiz answer. */
export function computeGamePoints(
  responseMs: number | undefined,
  limitSec: number,
  streak: number,
): number {
  const limitMs = Math.max(1, limitSec) * 1000;
  const rms = Math.min(Math.max(responseMs ?? limitMs, 0), limitMs);
  const speedFactor = 0.5 + 0.5 * (1 - rms / limitMs); // 0.5 .. 1.0
  const streakMult = 1 + Math.min(Math.max(streak - 1, 0), 5) * 0.1; // 1.0 .. 1.5
  return Math.round(GAME_BASE_POINTS * speedFactor * streakMult);
}

export interface GeneratedQuestion {
  type?: string;
  prompt: string;
  options?: string[] | null;
  acceptableAnswers?: string[];
  config?: Record<string, unknown> | null;
  explanation?: string | null;
  /** LLM-declared difficulty (easy | medium | hard); seeds the mastery item prior. */
  difficulty?: string | null;
  /** Cognitive depth this item targets (recall | understanding | application). */
  bloom?: string | null;
  /** Verbatim source span proving the correct answer (hallucination firewall). */
  sourceQuote?: string | null;
  /** Misconception rationale per option (index-aligned with options; null for the key). */
  optionRationales?: (string | null)[] | null;
}

export function formatBank(bank: {
  id: string;
  tenantId: string;
  title: string;
  topic: string | null;
  createdById: string;
  createdAt: Date;
  generationStatus?: 'PENDING' | 'GENERATING' | 'READY' | 'FAILED' | null;
  generationError?: string | null;
  questions?: { status: BankQuestionStatus }[];
  materials?: { content: { id: string; title: string } }[];
}) {
  const questions = bank.questions ?? [];
  return {
    id: bank.id,
    tenantId: bank.tenantId,
    title: bank.title,
    topic: bank.topic,
    createdById: bank.createdById,
    createdAt: bank.createdAt.toISOString(),
    generationStatus: bank.generationStatus ?? null,
    generationError: bank.generationError ?? null,
    questionCount: questions.length,
    approvedCount: questions.filter((q) => q.status === 'APPROVED').length,
    materials: (bank.materials ?? []).map((m) => ({ id: m.content.id, title: m.content.title })),
  };
}

/**
 * Validate that every given content id exists and belongs to this tenant, returning the
 * de-duplicated list. Keeps bank↔material links inside the tenant boundary.
 */
export async function assertTenantContentIds(
  tenantId: string,
  contentIds?: string[],
): Promise<string[]> {
  if (!contentIds || contentIds.length === 0) return [];
  const unique = [...new Set(contentIds)];
  const found = await prisma.content.findMany({
    where: { id: { in: unique }, tenantId },
    select: { id: true },
  });
  if (found.length !== unique.length) throw new AppError(404, 'One or more materials not found');
  return unique;
}

export function formatQuestion(question: {
  id: string;
  bankId: string;
  type: QuestionType;
  prompt: string;
  options: unknown;
  acceptableAnswers: unknown;
  config?: unknown;
  explanation: string | null;
  difficulty?: string | null;
  bloom?: string | null;
  sourceQuote?: string | null;
  optionRationales?: unknown;
  status: BankQuestionStatus;
  sourceContentId: string | null;
  sourceSectionId: string | null;
  createdAt: Date;
}) {
  return {
    id: question.id,
    bankId: question.bankId,
    type: question.type,
    prompt: question.prompt,
    options: question.options ? jsonStringArray(question.options) : null,
    acceptableAnswers: jsonStringArray(question.acceptableAnswers),
    config: parseQuestionConfig(question.config),
    explanation: question.explanation,
    difficulty: question.difficulty ?? null,
    bloom: question.bloom ?? null,
    sourceQuote: question.sourceQuote ?? null,
    optionRationales: Array.isArray(question.optionRationales)
      ? question.optionRationales.map((r) => (typeof r === 'string' ? r : null))
      : null,
    status: question.status,
    sourceContentId: question.sourceContentId,
    sourceSectionId: question.sourceSectionId,
    createdAt: question.createdAt.toISOString(),
  };
}

export function formatAssessment(assessment: {
  id: string;
  tenantId: string;
  bankId: string | null;
  title: string;
  instructions: string | null;
  maxAttempts: number;
  mode: 'WRITTEN' | 'GAME';
  secondsPerQuestion: number | null;
  status: 'DRAFT' | 'PUBLISHED';
  strictScoring: boolean;
  wrongPenalty: number;
  partialCredit: boolean;
  scheduledAt?: Date | null;
  isLive?: boolean;
  liveEndsAt?: Date | null;
  createdAt: Date;
  questions?: unknown[];
  assignments?: unknown[];
}) {
  return {
    id: assessment.id,
    tenantId: assessment.tenantId,
    bankId: assessment.bankId,
    title: assessment.title,
    instructions: assessment.instructions,
    maxAttempts: assessment.maxAttempts,
    mode: assessment.mode,
    secondsPerQuestion: assessment.secondsPerQuestion,
    status: assessment.status,
    strictScoring: assessment.strictScoring,
    wrongPenalty: assessment.wrongPenalty,
    partialCredit: assessment.partialCredit,
    scheduledAt: assessment.scheduledAt?.toISOString() ?? null,
    isLive: assessment.isLive ?? false,
    liveEndsAt: assessment.liveEndsAt?.toISOString() ?? null,
    createdAt: assessment.createdAt.toISOString(),
    questionCount: assessment.questions?.length ?? 0,
    assignmentCount: assessment.assignments?.length ?? 0,
  };
}

export async function assertBank(tenantId: string, bankId: string) {
  const bank = await prisma.questionBank.findFirst({ where: { id: bankId, tenantId } });
  if (!bank) throw new AppError(404, 'Question bank not found');
  return bank;
}

export async function getSectionContext(tenantId: string, contentId?: string, sectionId?: string) {
  if (!contentId) return null;
  const content = await prisma.content.findFirst({ where: { id: contentId, tenantId } });
  if (!content) throw new AppError(404, 'Content not found');

  const section = sectionId
    ? await prisma.contentSection.findFirst({ where: { id: sectionId, contentId } })
    : null;
  if (sectionId && !section) throw new AppError(404, 'Section not found');

  // Whole-material scope samples an even spread of chunks across the document (a plain
  // take-20 only ever saw the document's start, starving later sections of coverage).
  // Thin (heading-only) sections widen to the same spread — the sourceQuote firewall
  // would reject everything the model invents from a near-empty section context.
  let chunks = section
    ? await prisma.chunk.findMany({
        where: { contentId, chunkIndex: { gte: section.startChunk, lte: section.endChunk } },
        orderBy: { chunkIndex: 'asc' },
        take: 20,
        select: { text: true, chunkIndex: true },
      })
    : await sampleChunksEvenly(contentId, 20);
  if (section && chunks.reduce((sum, c) => sum + c.text.length, 0) < MIN_SECTION_CONTEXT_CHARS) {
    chunks = await sampleChunksEvenly(contentId, 20);
  }
  return buildRagContext(chunks.map((c) => ({ text: c.text, chunkIndex: c.chunkIndex })));
}

export async function assertLearnerAssignment(
  tenantId: string,
  userId: string,
  assessmentId: string,
) {
  const assignment = await prisma.assessmentAssignment.findFirst({
    where: { assessmentId, learnerId: userId, assessment: { tenantId } },
  });
  if (!assignment) throw new AppError(403, 'Assessment not assigned to you');
}

export interface LeaderboardAttempt {
  userId: string;
  pointsTotal: number;
  score: number | null;
  maxStreak: number;
  durationMs: number | null;
  user: { id: string; name: string | null; username: string | null; email: string };
}

export function learnerDisplayName(u: {
  name: string | null;
  username: string | null;
  email: string;
}): string {
  return u.name ?? u.username ?? u.email;
}
