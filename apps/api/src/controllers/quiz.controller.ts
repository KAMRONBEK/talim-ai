import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { quizQueue } from '../services/queue.service.js';
import { getParam } from '../lib/params.js';

const submitSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export async function createQuiz(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'contentId');

  const content = await prisma.content.findFirst({
    where: { id: contentId, userId: req.user.userId, status: 'READY' },
  });
  if (!content) throw new AppError(404, 'Content not found or not ready');

  const quiz = await prisma.quiz.create({
    data: { contentId, userId: req.user.userId },
  });

  await quizQueue.add({ contentId, userId: req.user.userId, quizId: quiz.id });

  res.status(202).json({
    quiz: {
      id: quiz.id,
      contentId: quiz.contentId,
      userId: quiz.userId,
      createdAt: quiz.createdAt.toISOString(),
      questions: [],
    },
  });
}

export async function getQuiz(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const quiz = await prisma.quiz.findFirst({
    where: { id: getParam(req, 'id'), userId: req.user.userId },
    include: { questions: true },
  });
  if (!quiz) throw new AppError(404, 'Quiz not found');

  res.json({
    quiz: {
      id: quiz.id,
      contentId: quiz.contentId,
      userId: quiz.userId,
      createdAt: quiz.createdAt.toISOString(),
      questions: quiz.questions.map((q) => ({
        id: q.id,
        quizId: q.quizId,
        question: q.question,
        options: q.options as string[],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    },
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
    if (body.answers[question.id] === question.correctAnswer) {
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

  res.json({
    attempt: {
      id: attempt.id,
      quizId: attempt.quizId,
      userId: attempt.userId,
      score: attempt.score,
      answers: attempt.answers as Record<string, string>,
      createdAt: attempt.createdAt.toISOString(),
    },
    correct,
    total: quiz.questions.length,
  });
}
