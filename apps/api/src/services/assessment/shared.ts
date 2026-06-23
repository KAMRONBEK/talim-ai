import { z } from 'zod';
import { type BankQuestionStatus, type QuestionType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { buildRagContext } from '../rag.service.js';

export const createBankSchema = z.object({
  title: z.string().min(1),
  topic: z.string().min(1).optional(),
});

export const questionStyleEnum = z.enum([
  'mixed',
  'multipleChoice',
  'trueFalse',
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

export const patchQuestionSchema = z.object({
  prompt: z.string().min(1).optional(),
  type: z.enum(['SHORT_ANSWER', 'NUMERIC', 'MULTIPLE_CHOICE']).optional(),
  options: z.array(z.string()).nullable().optional(),
  acceptableAnswers: z.array(z.string()).min(1).optional(),
  explanation: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'APPROVED', 'REJECTED']).optional(),
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
});

export const assignAssessmentSchema = z.object({
  learnerIds: z.array(z.string()).min(1),
  contentId: z.string().min(1).optional(),
  sectionId: z.string().min(1).optional(),
});

export const submitAssessmentSchema = z.object({
  answers: z.record(z.string(), z.string()),
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
  };
}

export function formatQuestion(question: {
  id: string;
  bankId: string;
  type: QuestionType;
  prompt: string;
  options: unknown;
  acceptableAnswers: unknown;
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
