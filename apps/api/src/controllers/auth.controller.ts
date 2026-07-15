import type { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { parseAppLocale } from '@talim/types';
import { resolveTenantIdForUser } from '../services/contentAccess.service.js';
import { createTutorRequest, getMyLatestTutorRequest } from '../services/tutorRequest.service.js';
import { joinTenantByCode } from '../services/tenant.service.js';

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).optional(),
    joinCode: z.string().min(4).max(12).optional(),
    role: z.never().optional(),
  })
  .strict();

// `email` is an identifier here — it accepts an email OR a student username.
const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

const joinSchema = z.object({
  joinCode: z.string().min(4).max(12),
});

const updateMeSchema = z.object({
  preferredLocale: z.enum(['uz', 'en', 'ru']).optional(),
  name: z.string().min(1).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

function signToken(
  userId: string,
  email: string,
  role: UserRole,
  tenantId?: string | null,
): string {
  return jwt.sign({ userId, email, role, ...(tenantId ? { tenantId } : {}) }, env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

async function formatUser(user: {
  id: string;
  email: string;
  username?: string | null;
  name: string | null;
  role: UserRole;
  mustChangePassword?: boolean;
  preferredLocale: string;
  createdAt: Date;
}) {
  const tenantId = await resolveTenantIdForUser(user.id, user.role);
  const tenant =
    tenantId && (user.role === 'TENANT_OWNER' || user.role === 'TENANT_LEARNER')
      ? await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } })
      : null;
  return {
    id: user.id,
    email: user.email,
    username: user.username ?? null,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword ?? false,
    preferredLocale: parseAppLocale(user.preferredLocale),
    tenantId,
    tenantName: tenant?.name ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function register(req: AuthenticatedRequest, res: Response): Promise<void> {
  const body = registerSchema.parse(req.body);
  // Normalize the email so capitalization/whitespace never splits one person into
  // two accounts and so they can later sign in regardless of how they type it.
  const email = body.email.trim().toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
  if (existing) {
    throw new AppError(409, 'Email already registered');
  }

  // Validate a supplied join code BEFORE creating the user: joinTenantByCode runs AFTER
  // user.create, so an invalid code would otherwise leave an orphaned INDIVIDUAL account
  // (with a FREE sub) that blocks the email on retry. joinTenantByCode still does the
  // authoritative join (seat quota, membership) once the account exists.
  if (body.joinCode) {
    const code = body.joinCode.trim().toUpperCase();
    const tenant = await prisma.tenant.findUnique({ where: { joinCode: code } });
    if (!tenant) throw new AppError(404, 'Invalid join code');
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const freePlan = await prisma.plan.findUnique({ where: { code: 'FREE' } });
  if (!freePlan) {
    throw new AppError(500, 'FREE plan not configured. Run the plan seed (pnpm db:seed).');
  }

  let user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: body.name ?? null,
      role: 'INDIVIDUAL',
      subscription: {
        create: {
          planId: freePlan.id,
          status: 'ACTIVE',
          source: 'ADMIN',
        },
      },
    },
  });

  // Optional: join a tutor's class immediately via a join code (becomes a learner).
  if (body.joinCode) {
    await joinTenantByCode(user.id, body.joinCode);
    user = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  }

  const formatted = await formatUser(user);
  const token = signToken(user.id, user.email, user.role, formatted.tenantId);
  res.status(201).json({ user: formatted, token });
}

export async function joinClass(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const body = joinSchema.parse(req.body);
  const { tenantName } = await joinTenantByCode(req.user.userId, body.joinCode);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user.userId } });
  const formatted = await formatUser(user);
  const token = signToken(user.id, user.email, user.role, formatted.tenantId);
  res.json({ user: formatted, token, tenantName });
}

export async function registerTenant(_req: AuthenticatedRequest, _res: Response): Promise<void> {
  throw new AppError(403, 'Tenant accounts are created by platform admins');
}

export async function upgradeToTenant(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const request = await createTutorRequest(req.user.userId, req.body);
  res.status(201).json({ request });
}

export async function getTutorRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const request = await getMyLatestTutorRequest(req.user.userId);
  res.json({ request });
}

export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body);
  const identifier = body.email.trim();
  // Accept either an email or a student username. Match case-insensitively so a
  // different capitalization (mobile keyboards auto-capitalize the first letter)
  // or an email stored with mixed case still resolves to the right account.
  const user = identifier.includes('@')
    ? await prisma.user.findFirst({ where: { email: { equals: identifier, mode: 'insensitive' } } })
    : await prisma.user.findFirst({
        where: { username: { equals: identifier, mode: 'insensitive' } },
      });
  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Invalid credentials');
  }

  const membership = await prisma.tenantMembership.findFirst({
    where: { userId: user.id, role: 'LEARNER', active: true },
  });
  if (user.role === 'TENANT_LEARNER' && !membership) {
    throw new AppError(403, 'Student account is deactivated');
  }

  const formatted = await formatUser(user);
  const token = signToken(user.id, user.email, user.role, formatted.tenantId);
  res.json({ user: formatted, token });
}

export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  const formatted = await formatUser(user);
  const body: { user: Awaited<ReturnType<typeof formatUser>>; token?: string } = {
    user: formatted,
  };
  if (req.legacyToken) {
    body.token = signToken(user.id, user.email, user.role, formatted.tenantId);
  }
  res.json(body);
}

export async function updateMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const body = updateMeSchema.parse(req.body ?? {});

  const user = await prisma.user.update({
    where: { id: req.user.userId },
    data: {
      ...(body.preferredLocale !== undefined ? { preferredLocale: body.preferredLocale } : {}),
      ...(body.name !== undefined ? { name: body.name } : {}),
    },
  });

  res.json({ user: await formatUser(user) });
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const body = changePasswordSchema.parse(req.body ?? {});
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) throw new AppError(404, 'User not found');

  const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
  if (!valid) throw new AppError(400, 'Current password is incorrect');

  // The new password must actually rotate — otherwise a mustChangePassword kid could
  // "change" to the same tutor-set secret and clear the forced-change flag without
  // rotating anything.
  if (body.newPassword === body.currentPassword) {
    throw new AppError(400, 'New password must be different from the current password');
  }

  const passwordHash = await bcrypt.hash(body.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      // The admin-recorded plaintext note no longer matches the password once the
      // user sets their own — clear it so support never surfaces a stale secret.
      adminPasswordNote: null,
    },
  });
  res.json({ ok: true });
}
