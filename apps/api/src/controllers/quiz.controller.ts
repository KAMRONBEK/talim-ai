import type { Response } from 'express';
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

const createQuizSchema = z.object({
  sectionId: z.string().min(1),
  kind: z.enum(['FULL', 'QUICK']).default('FULL'),
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
  locale: string;
  createdAt: Date;
  questions?: {
    id: string;
    quizId: string;
    question: string;
    options: unknown;
    correctAnswer: string;
    explanation: string | null;
  }[];
}) {
  return {
    id: quiz.id,
    contentId: quiz.contentId,
    userId: quiz.userId,
    sectionId: quiz.sectionId,
    kind: quiz.kind,
    locale: quiz.locale,
    createdAt: quiz.createdAt.toISOString(),
    questions: quiz.questions?.map((q) => ({
      id: q.id,
      quizId: q.quizId,
      question: q.question,
      options: q.options as string[],
      correctAnswer: q.correctAnswer,
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
  options: unknown;
  correctAnswer: string;
};

function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
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
    const options = Array.isArray(question.options) ? (question.options as string[]) : [];
    const resolvedCorrectAnswer = resolveCorrectAnswer(options, question.correctAnswer);
    const selectedAnswer = resolveSubmittedAnswer(options, submittedAnswers[question.id]);
    answers[question.id] = selectedAnswer;

    if (isSelectedAnswerCorrect(options, selectedAnswer, resolvedCorrectAnswer)) {
      correct++;
    }
  }

  const total = questions.length;
  const score = total > 0 ? (correct / total) * 100 : 0;
  return { answers, correct, total, score };
}

export async function createQuiz(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'contentId');
  const body = createQuizSchema.parse(req.body ?? {});
  const locale = body.locale ?? resolveLocale(req);

  const content = await prisma.content.findFirst({
    where: { id: contentId, userId: req.user.userId, status: 'READY' },
  });
  if (!content) throw new AppError(404, 'Content not found or not ready');

  const section = await prisma.contentSection.findFirst({
    where: { id: body.sectionId, contentId },
  });
  if (!section) throw new AppError(404, 'Section not found');

  const existing = await prisma.quiz.findFirst({
    where: {
      contentId,
      userId: req.user.userId,
      sectionId: body.sectionId,
      kind: body.kind,
      locale,
    },
    include: { questions: true },
    orderBy: { createdAt: 'desc' },
  });

  if (existing && existing.questions.length > 0) {
    res.json({ quiz: formatQuiz(existing), cached: true });
    return;
  }

  await assertQuota(req.user.userId, 'GENERATION', { role: req.user.role });

  const quiz =
    existing ??
    (await prisma.quiz.create({
      data: {
        contentId,
        userId: req.user.userId,
        sectionId: body.sectionId,
        kind: body.kind,
        locale,
      },
    }));

  await quizQueue.add({
    contentId,
    userId: req.user.userId,
    quizId: quiz.id,
    sectionId: body.sectionId,
    kind: body.kind,
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

  const content = await prisma.content.findFirst({
    where: { id: contentId, userId: req.user.userId },
  });
  if (!content) throw new AppError(404, 'Content not found');

  const quizzes = await prisma.quiz.findMany({
    where: { contentId, userId: req.user.userId, locale },
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
  const quiz = await prisma.quiz.findFirst({
    where: { id: getParam(req, 'id'), userId: req.user.userId },
    include: { questions: true },
  });
  if (!quiz) throw new AppError(404, 'Quiz not found');

  res.json({ quiz: formatQuiz(quiz) });
}

export async function listAttempts(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const quizId = getParam(req, 'id');

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, userId: req.user.userId },
  });
  if (!quiz) throw new AppError(404, 'Quiz not found');

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ attempts: attempts.map(formatAttempt) });
}

export async function getLatestAttempt(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const quizId = getParam(req, 'id');

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, userId: req.user.userId },
  });
  if (!quiz) throw new AppError(404, 'Quiz not found');

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

  const quiz = await prisma.quiz.findFirst({
    where: { id: getParam(req, 'id'), userId: req.user.userId },
    include: { questions: true },
  });
  if (!quiz) throw new AppError(404, 'Quiz not found');
  if (quiz.questions.length === 0) {
    throw new AppError(400, 'Quiz is still being generated');
  }

  const evaluation = evaluateQuizAnswers(quiz.questions, body.answers);

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId: req.user.userId,
      score: evaluation.score,
      answers: evaluation.answers,
    },
  });

  await updateProgressAfterQuizSubmit(req.user.userId, quiz, attempt, evaluation.answers);

  res.json({
    attempt: formatAttempt(attempt),
    correct: evaluation.correct,
    total: evaluation.total,
  });
}
