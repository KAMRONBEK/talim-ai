import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { slugifyOrgName } from '../lib/tenant-slug.js';
import { assertTenantQuota } from './subscription.service.js';
import { computeStreakDays } from './learningProgress.service.js';

const createStudentSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
});

const patchStudentSchema = z.object({
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

const patchTenantSchema = z.object({
  name: z.string().min(1).optional(),
});

const assignmentSchema = z.object({
  contentId: z.string().min(1),
  learnerId: z.string().min(1),
});

export function formatTenant(tenant: {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
}) {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    ownerId: tenant.ownerId,
    createdAt: tenant.createdAt.toISOString(),
  };
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugifyOrgName(base);
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await prisma.tenant.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    suffix++;
  }
}

export async function createTenantForOwner(
  ownerId: string,
  orgName: string,
): Promise<{ tenantId: string }> {
  const slug = await uniqueSlug(orgName);
  const tenant = await prisma.tenant.create({
    data: {
      name: orgName.trim(),
      slug,
      ownerId,
      memberships: {
        create: { userId: ownerId, role: 'OWNER' },
      },
    },
  });
  return { tenantId: tenant.id };
}

export async function getTenantForOwner(ownerId: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { ownerId },
  });
  if (!tenant) throw new AppError(404, 'Organization not found');
  return formatTenant(tenant);
}

export async function patchTenantForOwner(ownerId: string, input: { name?: string }) {
  const body = patchTenantSchema.parse(input);
  const tenant = await prisma.tenant.findFirst({ where: { ownerId } });
  if (!tenant) throw new AppError(404, 'Organization not found');

  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: { ...(body.name ? { name: body.name } : {}) },
  });
  return formatTenant(updated);
}

async function formatStudentRow(
  membership: {
    id: string;
    active: boolean;
    joinedAt: Date;
    user: { id: string; email: string; name: string | null };
  },
  tenantId: string,
) {
  const learnerId = membership.user.id;
  const [assignedCount, progressRows, quizAttempts] = await Promise.all([
    prisma.contentAssignment.count({ where: { learnerId, content: { tenantId } } }),
    prisma.contentProgress.findMany({
      where: { userId: learnerId, content: { tenantId } },
      select: { lastActivityAt: true },
      orderBy: { lastActivityAt: 'desc' },
      take: 1,
    }),
    prisma.quizAttempt.findMany({
      where: {
        userId: learnerId,
        quiz: { content: { tenantId } },
      },
      select: { score: true },
    }),
  ]);

  const lastActivityAt = progressRows[0]?.lastActivityAt?.toISOString() ?? null;
  const avgQuizScore =
    quizAttempts.length > 0
      ? quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length
      : null;

  return {
    id: membership.user.id,
    email: membership.user.email,
    name: membership.user.name,
    active: membership.active,
    joinedAt: membership.joinedAt.toISOString(),
    assignedCount,
    lastActivityAt,
    avgQuizScore,
  };
}

export async function listStudents(tenantId: string) {
  const memberships = await prisma.tenantMembership.findMany({
    where: { tenantId, role: 'LEARNER' },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { joinedAt: 'desc' },
  });
  return Promise.all(memberships.map((m) => formatStudentRow(m, tenantId)));
}

export async function createStudent(
  tenantId: string,
  assignedById: string,
  input: unknown,
) {
  const body = createStudentSchema.parse(input);
  await assertTenantQuota(tenantId, 'STUDENT');

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    const membership = await prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId, userId: existing.id } },
    });
    if (membership) throw new AppError(409, 'Student already exists in this organization');
    throw new AppError(409, 'Email already registered');
  }

  const tempPassword = crypto.randomUUID().slice(0, 12);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      name: body.name ?? null,
      role: 'TENANT_LEARNER',
      tenantMemberships: {
        create: { tenantId, role: 'LEARNER' },
      },
    },
  });

  const membership = await prisma.tenantMembership.findFirstOrThrow({
    where: { tenantId, userId: user.id },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  const student = await formatStudentRow(membership, tenantId);

  return { student, temporaryPassword: tempPassword };
}

export async function patchStudent(
  tenantId: string,
  learnerId: string,
  input: unknown,
) {
  const body = patchStudentSchema.parse(input);
  const membership = await prisma.tenantMembership.findFirst({
    where: { tenantId, userId: learnerId, role: 'LEARNER' },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!membership) throw new AppError(404, 'Student not found');

  if (body.name) {
    await prisma.user.update({ where: { id: learnerId }, data: { name: body.name } });
  }
  if (body.active !== undefined) {
    await prisma.tenantMembership.update({
      where: { id: membership.id },
      data: { active: body.active },
    });
  }

  const updated = await prisma.tenantMembership.findUniqueOrThrow({
    where: { id: membership.id },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  return formatStudentRow(updated, tenantId);
}

export async function deleteStudent(tenantId: string, learnerId: string) {
  const membership = await prisma.tenantMembership.findFirst({
    where: { tenantId, userId: learnerId, role: 'LEARNER' },
  });
  if (!membership) throw new AppError(404, 'Student not found');

  await prisma.tenantMembership.update({
    where: { id: membership.id },
    data: { active: false },
  });
}

export async function resetStudentPassword(tenantId: string, learnerId: string) {
  const membership = await prisma.tenantMembership.findFirst({
    where: { tenantId, userId: learnerId, role: 'LEARNER' },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!membership) throw new AppError(404, 'Student not found');

  const temporaryPassword = crypto.randomUUID().slice(0, 12);
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  await prisma.user.update({ where: { id: learnerId }, data: { passwordHash } });
  const student = await formatStudentRow(membership, tenantId);
  return { student, temporaryPassword };
}

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

export async function assignContent(
  tenantId: string,
  assignedById: string,
  input: unknown,
) {
  const body = assignmentSchema.parse(input);
  const [content, membership] = await Promise.all([
    prisma.content.findFirst({ where: { id: body.contentId, tenantId } }),
    prisma.tenantMembership.findFirst({
      where: { tenantId, userId: body.learnerId, role: 'LEARNER', active: true },
    }),
  ]);
  if (!content) throw new AppError(404, 'Content not found');
  if (!membership) throw new AppError(404, 'Student not found');

  const assignment = await prisma.contentAssignment.upsert({
    where: {
      contentId_learnerId: { contentId: body.contentId, learnerId: body.learnerId },
    },
    create: {
      contentId: body.contentId,
      learnerId: body.learnerId,
      assignedById,
    },
    update: {},
  });

  return {
    id: assignment.id,
    contentId: assignment.contentId,
    learnerId: assignment.learnerId,
    assignedById: assignment.assignedById,
    assignedAt: assignment.assignedAt.toISOString(),
  };
}

export async function unassignContent(tenantId: string, input: unknown) {
  const body = assignmentSchema.parse(input);
  const content = await prisma.content.findFirst({
    where: { id: body.contentId, tenantId },
  });
  if (!content) throw new AppError(404, 'Content not found');

  await prisma.contentAssignment.deleteMany({
    where: { contentId: body.contentId, learnerId: body.learnerId },
  });
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

export async function listContentAssignments(tenantId: string, contentId: string) {
  const content = await prisma.content.findFirst({ where: { id: contentId, tenantId } });
  if (!content) throw new AppError(404, 'Content not found');

  const rows = await prisma.contentAssignment.findMany({
    where: { contentId },
    include: { learner: { select: { id: true, email: true, name: true } } },
  });

  return rows.map((r) => ({
    id: r.id,
    contentId: r.contentId,
    learnerId: r.learnerId,
    learnerEmail: r.learner.email,
    learnerName: r.learner.name,
    assignedAt: r.assignedAt.toISOString(),
  }));
}
