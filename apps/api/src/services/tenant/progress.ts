import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { computeStreakDays } from '../learningProgress.service.js';
import { listStudents } from './students.js';

export async function getTenantProgress(tenantId: string) {
  const [students, materials, progressRows, quizAttempts] = await Promise.all([
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
  ]);

  const avgCoverage =
    progressRows.length > 0
      ? progressRows.reduce((sum, row) => sum + row.overallCoverage, 0) / progressRows.length
      : 0;
  const avgQuizScore =
    quizAttempts.length > 0
      ? quizAttempts.reduce((sum, row) => sum + row.score, 0) / quizAttempts.length
      : null;

  return {
    totals: {
      students: students.length,
      activeStudents: students.filter((s) => s.active).length,
      materials,
      avgCoverage,
      avgQuizScore,
    },
    students,
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

export async function getStudentProgress(tenantId: string, learnerId: string) {
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

  const [activityDays, streakDays] = await Promise.all([
    prisma.learningActivityDay.findMany({
      where: { userId: learnerId },
      orderBy: { date: 'desc' },
      take: 90,
    }),
    computeStreakDays(learnerId),
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
  };
}
