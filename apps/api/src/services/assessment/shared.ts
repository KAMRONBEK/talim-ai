import { z } from 'zod';
import { type BankQuestionStatus, type QuestionType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { buildRagContext } from '../rag.service.js';

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
export type QuestionStyle = z.infer<typeof questionStyleEnum>;

export const generateSchema = z.object({
  topic: z.string().min(1).optional(),
  contentId: z.string().min(1).optional(),
  sectionId: z.string().min(1).optional(),
  count: z.number().int().min(1).max(30).default(12),
  // What kind of questions to generate: a balanced mix, or all of one kind.
  style: questionStyleEnum.default('mixed'),
});

// Every question type the storage + scoring engine supports. Shared by the patch
// (edit/approve) and create (manual authoring) schemas so a tutor can hand-author or
// edit any type the AI generator can produce.
export const questionTypeEnum = z.enum([
  'SHORT_ANSWER',
  'NUMERIC',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'MULTIPLE_SELECT',
  'FILL_BLANK',
  'DROPDOWN_CLOZE',
  'MATCHING',
  'ORDERING',
]);

export const patchQuestionSchema = z.object({
  prompt: z.string().min(1).optional(),
  type: questionTypeEnum.optional(),
  options: z.array(z.string()).nullable().optional(),
  acceptableAnswers: z.array(z.string()).min(1).optional(),
  config: z.record(z.string(), z.unknown()).nullable().optional(),
  explanation: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'APPROVED', 'REJECTED']).optional(),
});

/**
 * Manual authoring of a bank question from scratch (not AI-generated). `prompt`, `type`,
 * and at least one `acceptableAnswers` are required; the structured types carry their
 * left/right/blanks/blankOptions in `config` (same shape the generator builders consume).
 */
export const createQuestionSchema = z.object({
  prompt: z.string().min(1),
  type: questionTypeEnum,
  options: z.array(z.string()).nullable().optional(),
  acceptableAnswers: z.array(z.string()).min(1),
  config: z.record(z.string(), z.unknown()).nullable().optional(),
  explanation: z.string().nullable().optional(),
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
  // Soft due date — informational only (display + overdue styling); does not block submission.
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
export type SubmitAnswerValue = z.infer<typeof submitAnswerValueSchema>;

export const submitAssessmentSchema = z.object({
  answers: z.record(z.string(), submitAnswerValueSchema),
  // Per-question elapsed time (ms) and total duration, used for GAME scoring.
  timings: z.record(z.string(), z.number().int().min(0)).optional(),
  durationMs: z.number().int().min(0).optional(),
});

export const GAME_BASE_POINTS = 1000;

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
}

export function jsonStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/**
 * A MULTIPLE_CHOICE question is only answerable if it has at least two options
 * AND at least one accepted answer exactly matches one of those options (after
 * normalization). Otherwise a learner can never select the correct string and is
 * guaranteed 0% — so such questions must never be persisted or approved.
 */
export function isAnswerableMultipleChoice(
  options: string[] | null | undefined,
  acceptableAnswers: string[],
): boolean {
  if (!options || options.length < 2) return false;
  const normalizedOptions = new Set(options.map(normalizeAnswer));
  return acceptableAnswers.some((a) => normalizedOptions.has(normalizeAnswer(a)));
}

export function formatBank(bank: {
  id: string;
  tenantId: string;
  title: string;
  topic: string | null;
  createdById: string;
  createdAt: Date;
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

  const chunks = await prisma.chunk.findMany({
    where: {
      contentId,
      ...(section ? { chunkIndex: { gte: section.startChunk, lte: section.endChunk } } : {}),
    },
    orderBy: { chunkIndex: 'asc' },
    take: 20,
  });
  return buildRagContext(chunks.map((c) => ({ text: c.text, chunkIndex: c.chunkIndex })));
}

export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isCorrect(question: { type: QuestionType; acceptableAnswers: unknown }, answer: string) {
  const acceptable = jsonStringArray(question.acceptableAnswers);
  // A blank/whitespace answer (including a game-quiz timer expiry, which submits '')
  // is never correct. Without this guard, NUMERIC grading treats Number('') === 0 as a
  // match whenever the correct answer is 0, awarding points for an unanswered question.
  if (!answer.trim()) return false;
  if (question.type === 'NUMERIC') {
    const answerNumber = Number(answer.replace(',', '.'));
    if (Number.isNaN(answerNumber)) return false;
    return acceptable.some((value) => Math.abs(Number(value.replace(',', '.')) - answerNumber) <= 0.001);
  }
  const normalized = normalizeAnswer(answer);
  return acceptable.some((value) => normalizeAnswer(value) === normalized);
}

/** Parse a Json question `config` blob into a plain object (or null). */
export function parseQuestionConfig(config: unknown): Record<string, unknown> | null {
  if (config && typeof config === 'object' && !Array.isArray(config)) {
    return config as Record<string, unknown>;
  }
  return null;
}

/**
 * Canonical String form stored in AttemptAnswer.answer. Plain strings are kept
 * verbatim (back-compat); structured answers (arrays/objects from MULTIPLE_SELECT /
 * FILL_BLANK) are JSON-stringified so they round-trip through the single String column.
 */
export function answerToString(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  return JSON.stringify(raw);
}

/**
 * Coerce a submitted answer into an array of strings for the multi-value types.
 * Accepts a real array, an object of strings (per-blank map), or a string that may
 * itself be a JSON-encoded array/object; a bare non-empty string becomes a 1-element
 * array so single-blank FILL_BLANK / single-select still work.
 */
function parseArrayAnswer(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string');
  if (raw && typeof raw === 'object') {
    return Object.values(raw).filter((v): v is string => typeof v === 'string');
  }
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (s.startsWith('[') || s.startsWith('{')) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === 'string');
        if (parsed && typeof parsed === 'object') {
          return Object.values(parsed).filter((v): v is string => typeof v === 'string');
        }
      } catch {
        /* not JSON — treat as a single bare answer below */
      }
    }
    return s ? [raw] : [];
  }
  return [];
}

/**
 * Coerce a submitted structured answer into a plain array or object (or null). Accepts a
 * real array/object, or a string that is itself a JSON-encoded array/object (belt-and-braces
 * for values that were round-tripped through the String answer column). Unlike
 * `parseArrayAnswer` this preserves object keys, which the MATCHING grader needs to resolve
 * a `{ leftPrompt: chosenRight }` map.
 */
function coerceStructuredAnswer(raw: unknown): unknown[] | Record<string, unknown> | null {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (s.startsWith('[') || s.startsWith('{')) {
      try {
        const parsed: unknown = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
      } catch {
        /* not JSON — no structured value */
      }
    }
  }
  return null;
}

/**
 * Resolve a MATCHING submission into the learner's chosen right-hand value per left prompt
 * (index-aligned with `left`). Two accepted submit shapes:
 *  - an ordered array of right values, parallel to `left`; or
 *  - an object keyed by left prompt text (or by the left index as a string).
 */
function parseMatchingChoices(raw: unknown, left: string[], count: number): string[] {
  const parsed = coerceStructuredAnswer(raw);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    let value: unknown;
    if (Array.isArray(parsed)) {
      value = parsed[i];
    } else if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      const key = left[i];
      value = (key != null ? obj[key] : undefined) ?? obj[String(i)];
    }
    out.push(typeof value === 'string' ? value : '');
  }
  return out;
}

/**
 * A MULTIPLE_SELECT question is answerable only if it has at least two options and at
 * least one accepted answer, and every accepted answer exactly matches one option.
 */
export function isAnswerableMultipleSelect(
  options: string[] | null | undefined,
  acceptableAnswers: string[],
): boolean {
  if (!options || options.length < 2) return false;
  if (acceptableAnswers.length < 1) return false;
  const normalizedOptions = new Set(options.map(normalizeAnswer));
  return acceptableAnswers.every((a) => normalizedOptions.has(normalizeAnswer(a)));
}

/** Accepted answers per blank for a FILL_BLANK question (index = blank position). */
function fillBlankAcceptedPerBlank(config: Record<string, unknown> | null, flat: string[]): string[][] {
  const blankAnswers = config?.blankAnswers;
  if (Array.isArray(blankAnswers) && blankAnswers.length > 0) {
    return blankAnswers.map((b) => jsonStringArray(b));
  }
  const blanks = typeof config?.blanks === 'number' && config.blanks > 0 ? config.blanks : 1;
  if (blanks <= 1) return [flat];
  // Multi-blank without an explicit per-blank map: match each accepted answer to its blank by index.
  return Array.from({ length: blanks }, (_, i) => (flat[i] != null ? [flat[i]] : []));
}

export interface GradeResult {
  /** Fully correct (exact/complete match) — drives the correct-count percentage and game streak. */
  correct: boolean;
  /** 0..1 credit for this answer (before strict weighting). */
  creditFraction: number;
  /** Whether the learner supplied any non-blank answer (a blank is neither correct nor penalized). */
  answered: boolean;
}

/**
 * Grade one question against a (possibly structured) submitted answer, computing
 * both full correctness and a 0..1 credit fraction. The string-answer types
 * (SHORT_ANSWER / NUMERIC / MULTIPLE_CHOICE / TRUE_FALSE) reuse `isCorrect` unchanged,
 * so their behaviour is identical to before.
 */
export function gradeQuestion(
  question: { type: QuestionType; options: unknown; acceptableAnswers: unknown; config?: unknown },
  raw: unknown,
  partialCredit: boolean,
): GradeResult {
  const acceptable = jsonStringArray(question.acceptableAnswers);

  if (question.type === 'MULTIPLE_SELECT') {
    const selected = [...new Set(parseArrayAnswer(raw).map(normalizeAnswer).filter(Boolean))];
    const correctSet = new Set(acceptable.map(normalizeAnswer));
    let correctlySelected = 0;
    let wronglySelected = 0;
    for (const s of selected) {
      if (correctSet.has(s)) correctlySelected += 1;
      else wronglySelected += 1;
    }
    const exact = correctlySelected === correctSet.size && wronglySelected === 0 && correctSet.size > 0;
    const denom = correctSet.size || 1;
    const partial = Math.min(Math.max((correctlySelected - wronglySelected) / denom, 0), 1);
    return {
      correct: exact,
      creditFraction: partialCredit ? partial : exact ? 1 : 0,
      answered: selected.length > 0,
    };
  }

  // DROPDOWN_CLOZE grades exactly like FILL_BLANK: one selected value per blank, matched
  // against the accepted value(s) for that blank. The only difference is presentation — the
  // learner picks from a per-blank option list (config.blankOptions) rather than typing.
  if (question.type === 'FILL_BLANK' || question.type === 'DROPDOWN_CLOZE') {
    const perBlank = fillBlankAcceptedPerBlank(parseQuestionConfig(question.config), acceptable);
    const answers = parseArrayAnswer(raw);
    let hit = 0;
    for (let i = 0; i < perBlank.length; i++) {
      const accepted = (perBlank[i] ?? []).map(normalizeAnswer);
      const got = normalizeAnswer(answers[i] ?? '');
      if (got && accepted.includes(got)) hit += 1;
    }
    const fraction = perBlank.length > 0 ? hit / perBlank.length : 0;
    const exact = fraction >= 1;
    return {
      correct: exact,
      creditFraction: partialCredit ? fraction : exact ? 1 : 0,
      answered: answers.some((a) => a.trim() !== ''),
    };
  }

  if (question.type === 'MATCHING') {
    // acceptableAnswers = the correct right-hand value per left prompt, index-aligned with
    // config.left. creditFraction = (#correctly matched pairs) / (#pairs); correct = all right.
    const config = parseQuestionConfig(question.config);
    const left = jsonStringArray(config?.left);
    const correct = acceptable;
    const count = correct.length;
    const chosen = parseMatchingChoices(raw, left, count);
    let hit = 0;
    for (let i = 0; i < count; i++) {
      const got = chosen[i] ?? '';
      const want = correct[i] ?? '';
      if (got && normalizeAnswer(got) === normalizeAnswer(want)) hit += 1;
    }
    const fraction = count > 0 ? hit / count : 0;
    const exact = count > 0 && hit === count;
    return {
      correct: exact,
      creditFraction: partialCredit ? fraction : exact ? 1 : 0,
      answered: chosen.some((c) => c.trim() !== ''),
    };
  }

  if (question.type === 'ORDERING') {
    // acceptableAnswers = the items in their correct order. Absolute-position scoring:
    // creditFraction = (#items placed in their correct absolute position) / (#items);
    // correct = the full submitted sequence matches the correct order.
    const correctOrder = acceptable;
    const submitted = parseArrayAnswer(raw);
    const count = correctOrder.length;
    let hit = 0;
    for (let i = 0; i < count; i++) {
      const got = submitted[i] ?? '';
      const want = correctOrder[i] ?? '';
      if (got && normalizeAnswer(got) === normalizeAnswer(want)) hit += 1;
    }
    const fraction = count > 0 ? hit / count : 0;
    const exact = count > 0 && hit === count && submitted.length === count;
    return {
      correct: exact,
      creditFraction: partialCredit ? fraction : exact ? 1 : 0,
      answered: submitted.some((a) => a.trim() !== ''),
    };
  }

  // SHORT_ANSWER / NUMERIC / MULTIPLE_CHOICE / TRUE_FALSE — single string answer.
  const answerString = answerToString(raw);
  const correct = isCorrect(question, answerString);
  return { correct, creditFraction: correct ? 1 : 0, answered: answerString.trim() !== '' };
}

export async function assertLearnerAssignment(tenantId: string, userId: string, assessmentId: string) {
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

export function learnerDisplayName(u: { name: string | null; username: string | null; email: string }): string {
  return u.name ?? u.username ?? u.email;
}
