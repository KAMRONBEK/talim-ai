import type { Response } from 'express';
import { Prisma, type QuestionType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { quizQueue } from '../services/queue.service.js';
import { getParam } from '../lib/params.js';
import { resolveLocale } from '../lib/locale.js';
import {
  answerToString,
  gradeQuestion,
  jsonStringArray,
  FLASHCARD_GUESS_FLOOR,
  FLASHCARD_SELF_REPORT_WEIGHT,
  type MasteryDelta,
} from '@talim/types';
import { updateProgressAfterQuizSubmit } from '../services/learningProgress.service.js';
import { assertQuota } from '../services/subscription.service.js';
import { assertCanAccessContent, assertCanGenerate } from '../services/contentAccess.service.js';
import { questionStyleEnum, questionDepthEnum, submitAnswerValueSchema } from '../services/assessment/shared.js';
import {
  recordAnswers,
  getContentMastery as getContentMasteryState,
  type AnswerEvidence,
} from '../services/sectionMastery.service.js';

const practiceTypeEnum = z.enum([
  'SHORT_ANSWER',
  'NUMERIC',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'MULTIPLE_SELECT',
  'FILL_BLANK',
  'DROPDOWN_CLOZE',
  'MATCHING',
  'ORDERING',
  // Self-graded study cards mixed into the same practice session (B2C only).
  'FLASHCARD',
]);

const createQuizSchema = z.object({
  // Scope: one section, or the whole material when omitted.
  sectionId: z.string().min(1).optional(),
  // QUICK is retired from the product surface; stale clients sending it get a FULL quiz.
  kind: z
    .enum(['FULL', 'QUICK'])
    .default('FULL')
    .transform(() => 'FULL' as const),
  // Legacy single-style knob (used when `types` is absent).
  style: questionStyleEnum.default('mixed'),
  // Unified generator params: explicit type set + cognitive depth + count.
  types: z.array(practiceTypeEnum).min(1).optional(),
  depth: questionDepthEnum.default('mixed'),
  count: z.number().int().min(1).max(30).optional(),
  locale: z.enum(['uz', 'en', 'ru']).optional(),
});

const submitSchema = z.object({
  // Structured types (MULTIPLE_SELECT / MATCHING / ORDERING / per-blank maps) submit
  // arrays/objects; plain types submit strings — same contract as assessments.
  answers: z.record(z.string(), submitAnswerValueSchema),
});

const DEFAULT_PRACTICE_COUNT = 10;

function formatQuiz(quiz: {
  id: string;
  contentId: string;
  userId: string;
  sectionId: string | null;
  kind: 'FULL' | 'QUICK';
  style: string;
  count: number | null;
  depth?: string;
  types?: unknown;
  locale: string;
  createdAt: Date;
  questions?: {
    id: string;
    quizId: string;
    question: string;
    type: QuestionType;
    options: unknown;
    correctAnswer: string;
    acceptableAnswers: unknown;
    config?: unknown;
    explanation: string | null;
    difficulty?: string | null;
    bloom?: string | null;
    sourceQuote?: string | null;
    optionRationales?: unknown;
    sourceSectionId?: string | null;
  }[];
}) {
  return {
    id: quiz.id,
    contentId: quiz.contentId,
    userId: quiz.userId,
    sectionId: quiz.sectionId,
    kind: quiz.kind,
    style: quiz.style,
    count: quiz.count,
    depth: quiz.depth ?? 'mixed',
    types: Array.isArray(quiz.types) ? (quiz.types as string[]) : null,
    locale: quiz.locale,
    createdAt: quiz.createdAt.toISOString(),
    questions: quiz.questions?.map((q) => ({
      id: q.id,
      quizId: q.quizId,
      question: q.question,
      type: q.type,
      options: q.options ? (q.options as string[]) : null,
      correctAnswer: q.correctAnswer,
      acceptableAnswers: jsonStringArray(q.acceptableAnswers),
      config:
        q.config && typeof q.config === 'object' && !Array.isArray(q.config)
          ? (q.config as Record<string, unknown>)
          : null,
      explanation: q.explanation,
      difficulty: q.difficulty ?? null,
      bloom: q.bloom ?? null,
      sourceQuote: q.sourceQuote ?? null,
      optionRationales: Array.isArray(q.optionRationales)
        ? (q.optionRationales as unknown[]).map((r) => (typeof r === 'string' ? r : null))
        : null,
      sourceSectionId: q.sourceSectionId ?? null,
    })),
  };
}

function formatAttempt(
  attempt: {
    id: string;
    quizId: string;
    userId: string;
    score: number;
    answers: unknown;
    createdAt: Date;
  },
  masteryDeltas?: MasteryDelta[],
) {
  return {
    id: attempt.id,
    quizId: attempt.quizId,
    userId: attempt.userId,
    score: attempt.score,
    answers: attempt.answers as Record<string, string>,
    createdAt: attempt.createdAt.toISOString(),
    ...(masteryDeltas ? { masteryDeltas } : {}),
  };
}

type QuizQuestionForEvaluation = {
  id: string;
  type: QuestionType;
  options: unknown;
  correctAnswer: string;
  acceptableAnswers: unknown;
  config?: unknown;
};

function normalizeForOptionMatch(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function getSubmittedOptionLabel(value: string): string | null {
  const match = value.trim().match(/^([A-Z])(?:[\).:\s]|$)/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function stripSubmittedOptionLabel(value: string): string {
  return value.trim().replace(/^[A-Z][\).:\s]+/i, '').trim();
}

/** Resolve a MULTIPLE_CHOICE submission ("B", "B) text", or the option text) to option text. */
function resolveSubmittedAnswer(options: string[], submittedAnswer: string | undefined): string {
  if (!submittedAnswer) return '';

  const exactOption = options.find(
    (option) => normalizeForOptionMatch(option) === normalizeForOptionMatch(submittedAnswer),
  );
  if (exactOption) return exactOption;

  const label = getSubmittedOptionLabel(submittedAnswer);
  if (label) {
    const labelIndex = label.charCodeAt(0) - 'A'.charCodeAt(0);
    if (labelIndex >= 0 && labelIndex < options.length) return options[labelIndex] ?? submittedAnswer;
  }

  const unlabelledAnswer = stripSubmittedOptionLabel(submittedAnswer);
  const matchingOption = options.find(
    (option) =>
      normalizeForOptionMatch(stripSubmittedOptionLabel(option)) ===
      normalizeForOptionMatch(unlabelledAnswer),
  );

  return matchingOption ?? submittedAnswer;
}

interface QuizEvaluation {
  /** Canonical answers persisted on the attempt (structured values JSON-stringified). */
  answers: Record<string, string>;
  /** Per-question graded credit 0..1 (partial credit for structured types). */
  credits: Record<string, number>;
  correct: number;
  total: number;
  score: number;
}

/**
 * Grade a submission with the shared grading engine (same one the tenant assessments and
 * the web instant feedback use). The score awards partial credit for structured types;
 * `correct` counts only fully-correct answers.
 */
function evaluateQuizAnswers(
  questions: QuizQuestionForEvaluation[],
  submittedAnswers: Record<string, unknown>,
): QuizEvaluation {
  const answers: Record<string, string> = {};
  const credits: Record<string, number> = {};
  let correct = 0;
  let creditSum = 0;

  for (const question of questions) {
    let raw = submittedAnswers[question.id];

    if (question.type === 'MULTIPLE_CHOICE') {
      const options = Array.isArray(question.options) ? (question.options as string[]) : [];
      raw = resolveSubmittedAnswer(options, typeof raw === 'string' ? raw : undefined);
    }

    answers[question.id] = answerToString(raw);
    const acceptable = jsonStringArray(question.acceptableAnswers);
    const graded = gradeQuestion(
      {
        type: question.type,
        options: question.options,
        acceptableAnswers:
          acceptable.length > 0 ? acceptable : question.correctAnswer ? [question.correctAnswer] : [],
        config: question.config,
      },
      raw,
      /* partialCredit */ true,
    );
    credits[question.id] = graded.creditFraction;
    creditSum += graded.creditFraction;
    if (graded.correct) correct++;
  }

  const total = questions.length;
  const score = total > 0 ? (creditSum / total) * 100 : 0;
  return { answers, credits, correct, total, score };
}

async function assertQuizAccess(req: AuthenticatedRequest, quizId: string) {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) throw new AppError(404, 'Quiz not found');
  await assertCanAccessContent(req.user, quiz.contentId, { requireReady: true });
  return quiz;
}

function quizCreatorUserId(user: NonNullable<AuthenticatedRequest['user']>): string {
  return user.userId;
}

export async function createQuiz(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  assertCanGenerate(req.user);
  const contentId = getParam(req, 'contentId');
  const body = createQuizSchema.parse(req.body ?? {});
  const locale = body.locale ?? resolveLocale(req);

  await assertCanAccessContent(req.user, contentId, { requireReady: true });

  if (body.sectionId) {
    const section = await prisma.contentSection.findFirst({
      where: { id: body.sectionId, contentId },
    });
    if (!section) throw new AppError(404, 'Section not found');
  }

  const count = body.count ?? DEFAULT_PRACTICE_COUNT;
  const types = body.types ?? null;
  const creatorId = quizCreatorUserId(req.user);
  const existing = await prisma.quiz.findFirst({
    where: {
      contentId,
      userId: creatorId,
      sectionId: body.sectionId ?? null,
      kind: body.kind,
      style: body.style,
      count,
      depth: body.depth,
      // Same-request reuse must match the exact type set (JSON equality; null = legacy/mixed).
      types: types ? { equals: types } : { equals: Prisma.DbNull },
      locale,
    },
    include: { questions: true },
    orderBy: { createdAt: 'desc' },
  });

  if (existing && existing.questions.length > 0) {
    res.json({ quiz: formatQuiz(existing), cached: true });
    return;
  }

  await assertQuota(req.user.userId, 'GENERATION', {
    role: req.user.role,
    tenantId: req.user.tenantId,
  });

  const quiz =
    existing ??
    (await prisma.quiz.create({
      data: {
        contentId,
        userId: creatorId,
        sectionId: body.sectionId ?? null,
        kind: body.kind,
        style: body.style,
        count,
        depth: body.depth,
        types: types ?? Prisma.DbNull,
        locale,
      },
    }));

  await quizQueue.add({
    contentId,
    userId: creatorId,
    quizId: quiz.id,
    sectionId: body.sectionId,
    kind: body.kind,
    style: body.style,
    count,
    types: types ?? undefined,
    depth: body.depth,
    locale,
  });

  res.status(202).json({
    quiz: formatQuiz({ ...quiz, questions: [] }),
    cached: false,
  });
}

export async function listQuizzesByContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'contentId');
  const locale = resolveLocale(req);

  await assertCanAccessContent(req.user, contentId);

  const quizUserFilter =
    req.user.role === 'INDIVIDUAL' ? { userId: req.user.userId } : {};

  const quizzes = await prisma.quiz.findMany({
    where: { contentId, locale, ...quizUserFilter },
    include: {
      questions: { select: { id: true } },
      attempts: {
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    quizzes: quizzes.map((q) => ({
      id: q.id,
      contentId: q.contentId,
      userId: q.userId,
      sectionId: q.sectionId,
      kind: q.kind,
      depth: q.depth,
      locale: q.locale,
      createdAt: q.createdAt.toISOString(),
      questionCount: q.questions.length,
      latestAttempt: q.attempts[0] ? formatAttempt(q.attempts[0]) : null,
    })),
  });
}

export async function getQuiz(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const base = await assertQuizAccess(req, getParam(req, 'id'));
  const quiz = await prisma.quiz.findUnique({
    where: { id: base.id },
    include: { questions: true },
  });
  if (!quiz) throw new AppError(404, 'Quiz not found');

  res.json({ quiz: formatQuiz(quiz) });
}

export async function listAttempts(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const quizId = getParam(req, 'id');

  await assertQuizAccess(req, quizId);

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ attempts: attempts.map((a) => formatAttempt(a)) });
}

export async function getLatestAttempt(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const quizId = getParam(req, 'id');

  await assertQuizAccess(req, quizId);

  const attempt = await prisma.quizAttempt.findFirst({
    where: { quizId, userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
  });

  if (!attempt) {
    res.json({ attempt: null });
    return;
  }

  const questions = await prisma.quizQuestion.findMany({ where: { quizId } });
  const evaluation = evaluateQuizAnswers(questions, attempt.answers as Record<string, string>);

  res.json({
    attempt: formatAttempt({
      ...attempt,
      score: evaluation.score,
      answers: evaluation.answers,
    }),
    correct: evaluation.correct,
    total: evaluation.total,
  });
}

export async function submitQuiz(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const body = submitSchema.parse(req.body);

  const quiz = await assertQuizAccess(req, getParam(req, 'id'));
  const fullQuiz = await prisma.quiz.findUnique({
    where: { id: quiz.id },
    include: { questions: true },
  });
  if (!fullQuiz) throw new AppError(404, 'Quiz not found');
  if (fullQuiz.questions.length === 0) {
    throw new AppError(400, 'Quiz is still being generated');
  }

  const evaluation = evaluateQuizAnswers(fullQuiz.questions, body.answers);

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: fullQuiz.id,
      userId: req.user.userId,
      score: evaluation.score,
      answers: evaluation.answers,
    },
  });

  // Elo-KT mastery: every answer moves per-section mastery up or down. Questions carry
  // their own section provenance; unresolved ones fall back to the quiz's scope.
  const evidence: AnswerEvidence[] = fullQuiz.questions.map((q) => ({
    itemKey: `quiz:${q.id}`,
    sectionId: q.sourceSectionId ?? fullQuiz.sectionId,
    questionType: q.type,
    options: q.options,
    credit: evaluation.credits[q.id] ?? 0,
    declaredDifficulty: q.difficulty,
    // Self-reported flashcard answers carry less evidence than auto-graded ones.
    ...(q.type === 'FLASHCARD'
      ? { weight: FLASHCARD_SELF_REPORT_WEIGHT, guessFloorOverride: FLASHCARD_GUESS_FLOOR }
      : {}),
  }));
  const masteryDeltas = await recordAnswers(req.user.userId, fullQuiz.contentId, evidence);

  await updateProgressAfterQuizSubmit(req.user.userId, fullQuiz, attempt, evaluation.answers);

  res.json({
    attempt: formatAttempt(attempt, masteryDeltas),
    correct: evaluation.correct,
    total: evaluation.total,
    masteryDeltas,
  });
}

/** Per-section Elo-KT mastery for the progress rail (band + 0–100 score, decayed). */
export async function getContentMastery(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'contentId');
  await assertCanAccessContent(req.user, contentId);
  res.json(await getContentMasteryState(req.user.userId, contentId));
}
