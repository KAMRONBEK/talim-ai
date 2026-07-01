import type { Badge } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { computeStreakDays } from './learningProgress.service.js';

// Extensible registry: add a code + how to earn it here and it flows through the API.
const STREAK_TARGET = 5;
const QUIZ_TARGET = 10;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

// Earned badges drop the fractional `progress` — it is only meaningful while unearned.
function finalize(badge: Badge): Badge {
  if (badge.earned) {
    const { progress: _omit, ...rest } = badge;
    return rest;
  }
  return badge;
}

/**
 * Pure read: derive achievement badges for a user from existing signals
 * (streak days, perfect scores, total quizzes/assessments taken). No writes.
 */
export async function computeBadges(userId: string): Promise<Badge[]> {
  const [streakDays, perfectQuiz, perfectAssessment, quizCount, assessmentCount] =
    await Promise.all([
      computeStreakDays(userId),
      prisma.quizAttempt.findFirst({ where: { userId, score: 100 }, select: { id: true } }),
      prisma.assessmentAttempt.findFirst({ where: { userId, score: 100 }, select: { id: true } }),
      prisma.quizAttempt.count({ where: { userId } }),
      prisma.assessmentAttempt.count({ where: { userId } }),
    ]);

  const totalQuizzes = quizCount + assessmentCount;
  const hasPerfect = Boolean(perfectQuiz) || Boolean(perfectAssessment);

  const badges: Badge[] = [
    {
      code: 'STREAK_5',
      label: '5-day streak',
      emoji: '\u{1F525}',
      earned: streakDays >= STREAK_TARGET,
      progress: clamp01(streakDays / STREAK_TARGET),
    },
    {
      code: 'FIRST_PERFECT',
      label: 'Perfect score',
      emoji: '\u{1F3AF}',
      earned: hasPerfect,
    },
    {
      code: 'TEN_QUIZZES',
      label: '10 quizzes taken',
      emoji: '\u{1F3C5}',
      earned: totalQuizzes >= QUIZ_TARGET,
      progress: clamp01(totalQuizzes / QUIZ_TARGET),
    },
  ];

  return badges.map(finalize);
}
