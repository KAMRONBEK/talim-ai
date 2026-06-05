import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { quizQueue } from '../services/queue.service.js';
import { getParam } from '../lib/params.js';
import { isSelectedAnswerCorrect } from '@talim/types';
import { updateProgressAfterQuizSubmit } from '../services/learningProgress.service.js';

const createQuizSchema = z.object({
  sectionId: z.string().min(1),
  kind: z.enum(['FULL', 'QUICK']).default('FULL'),
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

export async function createQuiz(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'contentId');
  const body = createQuizSchema.parse(req.body ?? {});

  const content = await prisma.content.findFirst({
    where: { id: contentId, userId: req.user.userId, status: 'READY' },
  });
  if (!content) throw new AppError(404, 'Content not found or not ready');

  const section = await prisma.contentSection.findFirst({
    where: { id: body.sectionId, contentId },
  });
  if (!section) throw new AppError(404, 'Section not found');

  const quiz = await prisma.quiz.create({
    data: {
      contentId,
      userId: req.user.userId,
      sectionId: body.sectionId,
      kind: body.kind,
    },
  });

  await quizQueue.add({
    contentId,
    userId: req.user.userId,
    quizId: quiz.id,
    sectionId: body.sectionId,
    kind: body.kind,
  });

  res.status(202).json({
    quiz: formatQuiz({ ...quiz, questions: [] }),
  });
}

export async function listQuizzesByContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'contentId');

  const content = await prisma.content.findFirst({
    where: { id: contentId, userId: req.user.userId },
  });
  if (!content) throw new AppError(404, 'Content not found');

  const quizzes = await prisma.quiz.findMany({
    where: { contentId, userId: req.user.userId },
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
  let correct = 0;
  const answers = attempt.answers as Record<string, string>;
  for (const question of questions) {
    const options = Array.isArray(question.options) ? (question.options as string[]) : [];
    if (isSelectedAnswerCorrect(options, answers[question.id], question.correctAnswer)) {
      correct++;
    }
  }

  res.json({
    attempt: formatAttempt(attempt),
    correct,
    total: questions.length,
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

  let correct = 0;
  for (const question of quiz.questions) {
    const options = Array.isArray(question.options) ? (question.options as string[]) : [];
    if (isSelectedAnswerCorrect(options, body.answers[question.id], question.correctAnswer)) {
      correct++;
    }
  }

  const score = (correct / quiz.questions.length) * 100;

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId: req.user.userId,
      score,
      answers: body.answers,
    },
  });

  await updateProgressAfterQuizSubmit(req.user.userId, quiz, attempt, body.answers);

  res.json({
    attempt: formatAttempt(attempt),
    correct,
    total: quiz.questions.length,
  });
}
