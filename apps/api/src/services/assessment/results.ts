import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { type LeaderboardAttempt, learnerDisplayName } from './shared.js';

/** Class leaderboard for an assessment: best attempt per learner, ranked by points. */
export async function getAssessmentLeaderboard(tenantId: string, assessmentId: string) {
  const assessment = await prisma.tenantAssessment.findFirst({
    where: { id: assessmentId, tenantId },
  });
  if (!assessment) throw new AppError(404, 'Assessment not found');

  const attempts = (await prisma.assessmentAttempt.findMany({
    where: { assessmentId },
    include: { user: { select: { id: true, name: true, username: true, email: true } } },
    orderBy: [{ pointsTotal: 'desc' }, { score: 'desc' }, { durationMs: 'asc' }],
  })) as LeaderboardAttempt[];

  const bestByUser = new Map<string, LeaderboardAttempt>();
  for (const a of attempts) {
    if (!bestByUser.has(a.userId)) bestByUser.set(a.userId, a);
  }

  const rows = [...bestByUser.values()].map((a, i) => ({
    rank: i + 1,
    learnerId: a.userId,
    learnerName: learnerDisplayName(a.user),
    pointsTotal: a.pointsTotal,
    score: a.score ?? 0,
    maxStreak: a.maxStreak,
  }));

  return { assessmentId, mode: assessment.mode, title: assessment.title, rows };
}

/** Tutor-facing results: who has submitted, best score/points, attempt count. */
export async function getAssessmentResults(tenantId: string, assessmentId: string) {
  const assessment = await prisma.tenantAssessment.findFirst({
    where: { id: assessmentId, tenantId },
    include: {
      questions: { select: { id: true } },
      assignments: {
        include: { learner: { select: { id: true, name: true, username: true, email: true } } },
      },
    },
  });
  if (!assessment) throw new AppError(404, 'Assessment not found');

  const attempts = await prisma.assessmentAttempt.findMany({
    where: { assessmentId },
    orderBy: [{ pointsTotal: 'desc' }, { score: 'desc' }],
  });
  const byUser = new Map<string, typeof attempts>();
  for (const a of attempts) {
    const arr = byUser.get(a.userId) ?? [];
    arr.push(a);
    byUser.set(a.userId, arr);
  }

  const seen = new Set<string>();
  const learners = assessment.assignments
    .filter((x) => x.learner && !seen.has(x.learnerId ?? ''))
    .map((x) => {
      seen.add(x.learnerId ?? '');
      const ua = byUser.get(x.learnerId ?? '') ?? [];
      const best = ua[0];
      return {
        learnerId: x.learner!.id,
        learnerName: learnerDisplayName(x.learner!),
        attempts: ua.length,
        submitted: ua.length > 0,
        bestScore: best?.score ?? null,
        bestPoints: best?.pointsTotal ?? 0,
        maxStreak: best?.maxStreak ?? 0,
      };
    });

  return {
    assessmentId,
    mode: assessment.mode,
    title: assessment.title,
    questionCount: assessment.questions.length,
    learners,
  };
}
