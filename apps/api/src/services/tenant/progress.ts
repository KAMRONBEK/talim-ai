import type { AppLocale, LearnerMaterial, LearnerProgress } from '@talim/types';
import { DEFAULT_LOCALE } from '@talim/types';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { computeStreakDays } from '../learningProgress.service.js';
import { SECTION_COMPLETE_THRESHOLD } from '../learningProgress.service.js';
import { resolveTenantIdForUser } from '../contentAccess.service.js';
import { getClassMastery, getLearnerMastery } from '../mastery.service.js';
import { computeBadges } from '../badges.service.js';
import { listStudents } from './students.js';

// A learner is "at risk" when their overall mastery is low OR they have gone quiet.
const AT_RISK_MASTERY_THRESHOLD = 50;
const STALE_ACTIVITY_DAYS = 14;

export async function getTenantProgress(tenantId: string, locale: AppLocale = DEFAULT_LOCALE) {
  const [students, materials, progressRows, quizAttempts, classMastery] = await Promise.all([
    listStudents(tenantId),
    prisma.content.count({ where: { tenantId } }),
    prisma.contentProgress.findMany({
      where: { content: { tenantId } },
      select: { overallCoverage: true },
    }),
    prisma.quizAttempt.findMany({
      where: { quiz: { content: { tenantId } } },
      select: { score: true },
    }),
    getClassMastery(tenantId, { locale }),
  ]);

  const avgCoverage =
    progressRows.length > 0
      ? progressRows.reduce((sum, row) => sum + row.overallCoverage, 0) / progressRows.length
      : 0;
  const avgQuizScore =
    quizAttempts.length > 0
      ? quizAttempts.reduce((sum, row) => sum + row.score, 0) / quizAttempts.length
      : null;

  const staleBefore = Date.now() - STALE_ACTIVITY_DAYS * 86400000;
  const atRisk = students.filter((s) => {
    if (!s.active) return false;
    const lowMastery = (s.mastery ?? 0) < AT_RISK_MASTERY_THRESHOLD;
    const lastMs = s.lastActivityAt ? new Date(s.lastActivityAt).getTime() : null;
    const stale = lastMs == null || lastMs < staleBefore;
    return lowMastery || stale;
  }).length;

  return {
    totals: {
      students: students.length,
      activeStudents: students.filter((s) => s.active).length,
      materials,
      avgCoverage,
      avgQuizScore,
      atRisk,
    },
    students,
    classMastery,
  };
}

export async function getLearnerSummary(userId: string) {
  const membership = await prisma.tenantMembership.findFirst({
    where: { userId, role: 'LEARNER', active: true },
    include: { tenant: { select: { id: true, name: true } } },
  });
  if (!membership) throw new AppError(404, 'Organization not found');

  const [assignedCount, progressRows, quizAttempts, streakDays] = await Promise.all([
    prisma.contentAssignment.count({
      where: { learnerId: userId, content: { tenantId: membership.tenantId } },
    }),
    prisma.contentProgress.findMany({
      where: { userId, content: { tenantId: membership.tenantId } },
      include: { content: { select: { title: true } } },
      orderBy: { lastActivityAt: 'desc' },
    }),
    prisma.quizAttempt.findMany({
      where: { userId, quiz: { content: { tenantId: membership.tenantId } } },
      select: { score: true },
    }),
    computeStreakDays(userId),
  ]);

  const latest = progressRows[0];
  const avgQuizScore =
    quizAttempts.length > 0
      ? quizAttempts.reduce((sum, row) => sum + row.score, 0) / quizAttempts.length
      : null;

  return {
    tenantName: membership.tenant.name,
    assignedCount,
    streakDays,
    avgQuizScore,
    lastActivityAt: latest?.lastActivityAt.toISOString() ?? null,
    continueContent: latest
      ? {
          contentId: latest.contentId,
          title: latest.content.title,
          lastSectionId: latest.lastSectionId,
          overallCoverage: latest.overallCoverage,
        }
      : null,
  };
}

/**
 * A learner's assigned materials with per-material progress (compute-on-read).
 * Scoped to the learner's active tenant via the contentAccess membership guard.
 */
export async function getLearnerMaterials(userId: string): Promise<LearnerMaterial[]> {
  const tenantId = await resolveTenantIdForUser(userId, 'TENANT_LEARNER');
  if (!tenantId) return [];

  const assignments = await prisma.contentAssignment.findMany({
    where: { learnerId: userId, content: { tenantId } },
    include: { content: { select: { id: true, title: true, type: true } } },
    orderBy: { assignedAt: 'desc' },
  });
  if (assignments.length === 0) return [];

  const contentIds = assignments.map((a) => a.contentId);
  const progressRows = await prisma.contentProgress.findMany({
    where: { userId, contentId: { in: contentIds } },
    select: { contentId: true, overallCoverage: true, lastActivityAt: true },
  });
  const progressMap = new Map(progressRows.map((p) => [p.contentId, p]));

  return assignments.map((a) => {
    const progress = progressMap.get(a.contentId);
    const coverage = Math.round(progress?.overallCoverage ?? 0);
    const status: LearnerMaterial['status'] =
      coverage <= 0
        ? 'not_started'
        : coverage >= SECTION_COMPLETE_THRESHOLD
          ? 'completed'
          : 'in_progress';
    return {
      contentId: a.contentId,
      title: a.content.title,
      type: a.content.type,
      coverage,
      status,
      lastActivityAt: progress?.lastActivityAt?.toISOString() ?? null,
    };
  });
}

/**
 * The learner's own consolidated progress dashboard: mastery + streak + activity +
 * quiz accuracy + badges. Compute-on-read from existing progress/attempt rows.
 */
export async function getLearnerProgress(
  userId: string,
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<LearnerProgress> {
  const [mastery, badges, streakDays, activityDayRows, quizAgg, assessmentAgg] = await Promise.all([
    getLearnerMastery(userId, { locale }),
    computeBadges(userId),
    computeStreakDays(userId),
    prisma.learningActivityDay.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 90,
      select: { date: true },
    }),
    prisma.quizAttempt.aggregate({ where: { userId }, _avg: { score: true }, _count: { _all: true } }),
    prisma.assessmentAttempt.aggregate({
      where: { userId },
      _avg: { score: true },
      _count: { _all: true },
    }),
  ]);

  const quizzesTaken = quizAgg._count._all + assessmentAgg._count._all;

  // Weighted accuracy across quiz + assessment attempts (Prisma _avg already ignores
  // null assessment scores). Null when the learner has no attempts yet.
  const quizN = quizAgg._count._all;
  const assessN = assessmentAgg._count._all;
  const totalN = quizN + assessN;
  const avgAccuracy =
    totalN > 0
      ? Math.round(((quizAgg._avg.score ?? 0) * quizN + (assessmentAgg._avg.score ?? 0) * assessN) / totalN)
      : null;

  return {
    overallMastery: mastery.overallMastery,
    streakDays,
    materialsDone: mastery.materialsDone,
    quizzesTaken,
    avgAccuracy,
    masteryByTopic: mastery.masteryByTopic,
    badges,
    activityDays: activityDayRows.map((d) => d.date.toISOString().slice(0, 10)),
  };
}

export async function getStudentProgress(
  tenantId: string,
  learnerId: string,
  locale: AppLocale = DEFAULT_LOCALE,
) {
  const membership = await prisma.tenantMembership.findFirst({
    where: { tenantId, userId: learnerId, role: 'LEARNER' },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!membership) throw new AppError(404, 'Student not found');

  const assignments = await prisma.contentAssignment.findMany({
    where: { learnerId },
    include: { content: { select: { id: true, title: true, tenantId: true } } },
  });
  const tenantAssignments = assignments.filter((a) => a.content.tenantId === tenantId);

  const [activityDays, streakDays, mastery, badges] = await Promise.all([
    prisma.learningActivityDay.findMany({
      where: { userId: learnerId },
      orderBy: { date: 'desc' },
      take: 90,
    }),
    computeStreakDays(learnerId),
    // Pass tenantId explicitly so a deactivated student's topic mastery still resolves.
    getLearnerMastery(learnerId, { tenantId, locale }),
    computeBadges(learnerId),
  ]);

  const contentProgress = await Promise.all(
    tenantAssignments.map(async (a) => {
      const [progress, attempts] = await Promise.all([
        prisma.contentProgress.findUnique({
          where: { userId_contentId: { userId: learnerId, contentId: a.contentId } },
        }),
        prisma.quizAttempt.findMany({
          where: { userId: learnerId, quiz: { contentId: a.contentId } },
          select: { score: true },
        }),
      ]);
      const avgQuizScore =
        attempts.length > 0
          ? attempts.reduce((s, x) => s + x.score, 0) / attempts.length
          : null;
      return {
        contentId: a.contentId,
        contentTitle: a.content.title,
        overallCoverage: progress?.overallCoverage ?? 0,
        lastActivityAt: progress?.lastActivityAt?.toISOString() ?? null,
        quizAttempts: attempts.length,
        avgQuizScore,
      };
    }),
  );

  return {
    student: {
      id: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      active: membership.active,
    },
    activityDays: activityDays.map((d) => d.date.toISOString().slice(0, 10)),
    streakDays,
    contentProgress,
    masteryByTopic: mastery.masteryByTopic,
    badges,
  };
}
