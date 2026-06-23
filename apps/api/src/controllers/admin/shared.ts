import crypto from 'crypto';
import { z } from 'zod';
import type { Prisma, UserRole } from '@prisma/client';
import { parseAppLocale } from '@talim/types';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['INDIVIDUAL', 'TENANT_OWNER', 'TENANT_LEARNER', 'ADMIN']).optional(),
});

export function generateTemporaryPassword(): string {
  return crypto.randomUUID().slice(0, 12);
}

export function formatAdminUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  preferredLocale: string;
  adminPasswordNote?: string | null;
  createdAt: Date;
  _count?: { contents: number };
  contents?: { updatedAt: Date }[];
  subscription?: { status: string; plan: { code: string } } | null;
}) {
  const lastActivity = user.contents?.[0]?.updatedAt;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    preferredLocale: parseAppLocale(user.preferredLocale),
    adminPasswordNote: user.adminPasswordNote ?? null,
    createdAt: user.createdAt.toISOString(),
    contentCount: user._count?.contents ?? 0,
    lastActivityAt: lastActivity ? lastActivity.toISOString() : null,
    planCode: user.subscription?.plan.code ?? null,
    subscriptionStatus: (user.subscription?.status as
      | 'ACTIVE'
      | 'PAST_DUE'
      | 'CANCELED'
      | 'TRIALING'
      | undefined) ?? null,
  };
}

export function buildUserWhere(search?: string, role?: UserRole): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  if (role) where.role = role;
  if (search?.trim()) {
    const q = search.trim();
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
    ];
  }
  return where;
}
