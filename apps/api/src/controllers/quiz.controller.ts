import type { Response } from 'express';
import type { QuestionType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { quizQueue } from '../services/queue.service.js';
import { getParam } from '../lib/params.js';
import { resolveLocale } from '../lib/locale.js';
import { isSelectedAnswerCorrect, resolveCorrectAnswer } from '@talim/types';
import { updateProgressAfterQuizSubmit } from '../services/learningProgress.service.js';
import { assertQuota } from '../services/subscription.service.js';
import { assertCanAccessContent, assertCanGenerate } from '../services/contentAccess.service.js';
import { questionStyleEnum, jsonStringArray } from '../services/assessment/shared.js';

const createQuizSchema = z.object({
  sectionId: z.string().min(1),
  kind: z.enum(['FULL', 'QUICK']).default('FULL'),
  // Question-type style, mirroring the tutor question-bank generator.
  style: questionStyleEnum.default('mixed'),
  // Optional explicit question count (1–30); null/omitted derives from kind.
  count: z.number().int().min(1).max(30).optional(),
  locale: z.enum(['uz', 'en', 'ru']).optional(),
});

const submitSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

function formatQuiz(quiz: {
  id: string;
  contentId: string;
  userId: string;
  sectionId: string | null;
  kind: 'FULL' | 'QUICK';
  style: string;
  count: number | null;
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
    explanation: string | null;
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
      explanation: q.explanation,
    })),
  };
}

function formatAttempt(attempt: {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  answers: unknown;
  createdAt: Date;
}) {
  return {
    id: attempt.id,
    quizId: attempt.quizId,
    userId: attempt.userId,
    score: attempt.score,
    answers: attempt.answers as Record<string, string>,
    createdAt: attempt.createdAt.toISOString(),
  };
}

type QuizQuestionForEvaluation = {
  id: string;
  type: QuestionType;
  options: unknown;
  correctAnswer: string;
  acceptableAnswers: unknown;
};

function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Grade a SHORT_ANSWER or NUMERIC answer against the accepted answers. Mirrors the
 * tenant-assessment grading: numeric tolerance for NUMERIC, normalized exact match
 * for SHORT_ANSWER. A blank answer is never correct.
 */
function isOpenAnswerCorrect(type: QuestionType, acceptable: string[], answer: string): boolean {
  if (!answer.trim() || acceptable.length === 0) return false;
  if (type === 'NUMERIC') {
    const answerNumber = Number(answer.replace(',', '.'));
    if (Number.isNaN(answerNumber)) return false;
    return acceptable.some(
      (value) => Math.abs(Number(value.replace(',', '.')) - answerNumber) <= 0.001,
    );
  }
  const normalized = normalizeAnswer(answer);
  return acceptable.some((value) => normalizeAnswer(value) === normalized);
}

function getSubmittedOptionLabel(value: string): string | null {
  const match = value.trim().match(/^([A-Z])(?:[\).:\s]|$)/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function stripSubmittedOptionLabel(value: string): string {
  return value.trim().replace(/^[A-Z][\).:\s]+/i, '').trim();
}

function resolveSubmittedAnswer(options: string[], submittedAnswer: string | undefined): string {
  if (!submittedAnswer) return '';

  const exactOption = options.find((option) => normalizeAnswer(option) === normalizeAnswer(submittedAnswer));
  if (exactOption) return exactOption;

  const label = getSubmittedOptionLabel(submittedAnswer);
  if (label) {
    const labelIndex = label.charCodeAt(0) - 'A'.charCodeAt(0);
    if (labelIndex >= 0 && labelIndex < options.length) return options[labelIndex] ?? submittedAnswer;
  }

  const unlabelledAnswer = stripSubmittedOptionLabel(submittedAnswer);
  const matchingOption = options.find(
    (option) => normalizeAnswer(stripSubmittedOptionLabel(option)) === normalizeAnswer(unlabelledAnswer),
  );

  return matchingOption ?? submittedAnswer;
}

function evaluateQuizAnswers(
  questions: QuizQuestionForEvaluation[],
  submittedAnswers: Record<string, string>,
) {
  const answers: Record<string, string> = {};
  let correct = 0;

  for (const question of questions) {
    if (question.type === 'MULTIPLE_CHOICE') {
      const options = Array.isArray(question.options) ? (question.options as string[]) : [];
      const resolvedCorrectAnswer = resolveCorrectAnswer(options, question.correctAnswer);
      const selectedAnswer = resolveSubmittedAnswer(options, submittedAnswers[question.id]);
      answers[question.id] = selectedAnswer;
      if (isSelectedAnswerCorrect(options, selectedAnswer, resolvedCorrectAnswer)) {
        correct++;
      }
      continue;
    }

    // SHORT_ANSWER / NUMERIC: grade the raw typed answer against acceptable answers.
    const raw = (submittedAnswers[question.id] ?? '').trim();
    answers[question.id] = raw;
    const acceptable = jsonStringArray(question.acceptableAnswers);
    const accepted = acceptable.length > 0 ? acceptable : question.correctAnswer ? [question.correctAnswer] : [];
    if (isOpenAnswerCorrect(question.type, accepted, raw)) {
      correct++;
    }
  }

  const total = questions.length;
  const score = total > 0 ? (correct / total) * 100 : 0;
  return { answers, correct, total, score };
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

  const section = await prisma.contentSection.findFirst({
    where: { id: body.sectionId, contentId },
  });
  if (!section) throw new AppError(404, 'Section not found');

  const creatorId = quizCreatorUserId(req.user);
  const existing = await prisma.quiz.findFirst({
    where: {
      contentId,
      userId: creatorId,
      sectionId: body.sectionId,
      kind: body.kind,
      style: body.style,
      count: body.count ?? null,
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
        sectionId: body.sectionId,
        kind: body.kind,
        style: body.style,
        count: body.count ?? null,
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
    count: body.count,
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

  res.json({ attempts: attempts.map(formatAttempt) });
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

  await updateProgressAfterQuizSubmit(req.user.userId, fullQuiz, attempt, evaluation.answers);

  res.json({
    attempt: formatAttempt(attempt),
    correct: evaluation.correct,
    total: evaluation.total,
  });
}
