import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { slugifyOrgName } from '../../lib/tenant-slug.js';

export const createStudentSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    username: z
      .string()
      .min(3)
      .max(40)
      .regex(/^[a-zA-Z0-9._-]+$/, 'Username may use letters, numbers, dot, underscore, hyphen')
      .optional(),
    password: z.string().min(6).max(100).optional(),
  })
  .refine((b) => Boolean(b.email || b.username), {
    message: 'Provide an email or a username for the student',
  });

export const patchStudentSchema = z.object({
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

export const patchTenantSchema = z.object({
  name: z.string().min(1).optional(),
});

export const assignmentSchema = z.object({
  contentId: z.string().min(1),
  learnerId: z.string().min(1),
});

export function formatTenant(tenant: {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  seatLimit?: number | null;
  joinCode?: string | null;
}) {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    ownerId: tenant.ownerId,
    seatLimit: tenant.seatLimit ?? null,
    joinCode: tenant.joinCode ?? null,
    createdAt: tenant.createdAt.toISOString(),
  };
}

export async function uniqueSlug(base: string): Promise<string> {
  let slug = slugifyOrgName(base);
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await prisma.tenant.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    suffix++;
  }
}

const DEFAULT_TENANT_PLAN_CODE = 'TENANT_STARTER';

export async function getDefaultTenantPlanId(): Promise<string> {
  const plan = await prisma.plan.findUnique({ where: { code: DEFAULT_TENANT_PLAN_CODE } });
  if (!plan) {
    throw new AppError(
      500,
      `${DEFAULT_TENANT_PLAN_CODE} plan not configured. Run the plan seed (pnpm db:seed).`,
    );
  }
  return plan.id;
}

// Human-friendly join code alphabet (no easily-confused 0/O/1/I/L).
const JOIN_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomJoinCode(len: number): string {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (const b of bytes) {
    out += JOIN_CODE_ALPHABET.charAt(b % JOIN_CODE_ALPHABET.length);
  }
  return out;
}

export async function generateUniqueJoinCode(): Promise<string> {
  for (let i = 0; i < 12; i += 1) {
    const code = randomJoinCode(i < 8 ? 6 : 8);
    const existing = await prisma.tenant.findUnique({
      where: { joinCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  return randomJoinCode(10);
}

export async function formatStudentRow(
  membership: {
    id: string;
    active: boolean;
    joinedAt: Date;
    user: { id: string; email: string; name: string | null; username?: string | null };
  },
  tenantId: string,
) {
  const learnerId = membership.user.id;
  const [assignedCount, progressRows, quizAttempts, masteryAgg] = await Promise.all([
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
    prisma.contentProgress.aggregate({
      where: { userId: learnerId, content: { tenantId } },
      _avg: { overallCoverage: true },
    }),
  ]);

  const lastActivityAt = progressRows[0]?.lastActivityAt?.toISOString() ?? null;
  const avgQuizScore =
    quizAttempts.length > 0
      ? quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length
      : null;
  const mastery =
    masteryAgg._avg.overallCoverage == null ? null : Math.round(masteryAgg._avg.overallCoverage);

  // Hide synthesized internal emails for username-only students.
  const hasUsername = Boolean(membership.user.username);
  return {
    id: membership.user.id,
    email: hasUsername ? null : membership.user.email,
    username: membership.user.username ?? null,
    name: membership.user.name,
    active: membership.active,
    joinedAt: membership.joinedAt.toISOString(),
    assignedCount,
    lastActivityAt,
    avgQuizScore,
    mastery,
  };
}
