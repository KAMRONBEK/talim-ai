import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { assertTenantQuota } from '../subscription.service.js';
import {
  createStudentSchema,
  formatStudentRow,
  patchStudentSchema,
} from './shared.js';

export async function listStudents(tenantId: string) {
  const memberships = await prisma.tenantMembership.findMany({
    where: { tenantId, role: 'LEARNER' },
    include: { user: { select: { id: true, email: true, name: true, username: true } } },
    orderBy: { joinedAt: 'desc' },
  });
  const learnerIds = memberships.map((m) => m.user.id);
  if (learnerIds.length === 0) return [];

  // Aggregate in a fixed number of queries instead of N-per-student (avoids N+1).
  const [assignCounts, progressRows, quizAgg, masteryAgg] = await Promise.all([
    prisma.contentAssignment.groupBy({
      by: ['learnerId'],
      where: { learnerId: { in: learnerIds }, content: { tenantId } },
      _count: { _all: true },
    }),
    prisma.contentProgress.findMany({
      where: { userId: { in: learnerIds }, content: { tenantId } },
      select: { userId: true, lastActivityAt: true },
      orderBy: { lastActivityAt: 'desc' },
    }),
    prisma.quizAttempt.groupBy({
      by: ['userId'],
      where: { userId: { in: learnerIds }, quiz: { content: { tenantId } } },
      _avg: { score: true },
    }),
    prisma.contentProgress.groupBy({
      by: ['userId'],
      where: { userId: { in: learnerIds }, content: { tenantId } },
      _avg: { overallCoverage: true },
    }),
  ]);

  const assignMap = new Map(assignCounts.map((r) => [r.learnerId, r._count._all]));
  const lastActivityMap = new Map<string, Date>();
  for (const p of progressRows) {
    if (!lastActivityMap.has(p.userId)) lastActivityMap.set(p.userId, p.lastActivityAt);
  }
  const avgMap = new Map(quizAgg.map((r) => [r.userId, r._avg.score]));
  const masteryMap = new Map(masteryAgg.map((r) => [r.userId, r._avg.overallCoverage]));

  return memberships.map((m) => {
    const uid = m.user.id;
    const hasUsername = Boolean(m.user.username);
    const rawMastery = masteryMap.get(uid);
    return {
      id: uid,
      email: hasUsername ? null : m.user.email,
      username: m.user.username ?? null,
      name: m.user.name,
      active: m.active,
      joinedAt: m.joinedAt.toISOString(),
      assignedCount: assignMap.get(uid) ?? 0,
      lastActivityAt: lastActivityMap.get(uid)?.toISOString() ?? null,
      avgQuizScore: avgMap.get(uid) ?? null,
      mastery: rawMastery == null ? null : Math.round(rawMastery),
    };
  });
}

export async function createStudent(
  tenantId: string,
  assignedById: string,
  input: unknown,
) {
  const body = createStudentSchema.parse(input);
  await assertTenantQuota(tenantId, 'STUDENT');

  const username = body.username?.trim();
  let email = body.email?.trim();

  if (username) {
    const taken = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (taken) throw new AppError(409, 'Username already taken');
    // Synthesize a stable internal email for username-only (email-less) students.
    if (!email) email = `${username.toLowerCase()}@students.talim.local`;
  }
  if (!email) throw new AppError(400, 'Provide an email or a username for the student');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const membership = await prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId, userId: existing.id } },
    });
    if (membership) {
      if (membership.active) {
        throw new AppError(409, 'Student already exists in this organization');
      }
      // Re-adding a previously-removed student reactivates the membership and
      // issues fresh credentials (seat quota was already asserted above).
      const tempPassword = body.password ?? crypto.randomUUID().slice(0, 12);
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      await prisma.$transaction([
        prisma.tenantMembership.update({ where: { id: membership.id }, data: { active: true } }),
        prisma.user.update({
          where: { id: existing.id },
          data: { passwordHash, mustChangePassword: !body.password },
        }),
      ]);
      const reactivated = await prisma.tenantMembership.findUniqueOrThrow({
        where: { id: membership.id },
        include: { user: { select: { id: true, email: true, name: true, username: true } } },
      });
      const student = await formatStudentRow(reactivated, tenantId);
      return { student, temporaryPassword: tempPassword };
    }
    throw new AppError(409, 'Email already registered');
  }

  const tempPassword = body.password ?? crypto.randomUUID().slice(0, 12);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email,
        username: username ?? null,
        passwordHash,
        // Auto-generated passwords should be changed on first login; tutor-set ones need not.
        mustChangePassword: !body.password,
        name: body.name ?? null,
        role: 'TENANT_LEARNER',
        tenantMemberships: {
          create: { tenantId, role: 'LEARNER' },
        },
      },
    });
  } catch (err) {
    // Two simultaneous creates (e.g. a double-click) can both pass the findUnique checks
    // above, then race onto the unique email/username constraint. Surface a clean 409
    // instead of a raw 500 (Prisma P2002 unique-constraint violation).
    if ((err as { code?: string }).code === 'P2002') {
      throw new AppError(409, 'Username already taken');
    }
    throw err;
  }

  const membership = await prisma.tenantMembership.findFirstOrThrow({
    where: { tenantId, userId: user.id },
    include: { user: { select: { id: true, email: true, name: true, username: true } } },
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
    // Reactivating a student consumes a seat — re-check the quota.
    if (body.active && !membership.active) {
      await assertTenantQuota(tenantId, 'STUDENT');
    }
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
  await prisma.user.update({
    where: { id: learnerId },
    data: { passwordHash, mustChangePassword: true },
  });
  const student = await formatStudentRow(membership, tenantId);
  return { student, temporaryPassword };
}
