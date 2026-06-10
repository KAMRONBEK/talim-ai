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

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).optional(),
    role: z.never().optional(),
  })
  .strict();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
  return jwt.sign(
    { userId, email, role, ...(tenantId ? { tenantId } : {}) },
    env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

async function formatUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
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
    name: user.name,
    role: user.role,
    preferredLocale: parseAppLocale(user.preferredLocale),
    tenantId,
    tenantName: tenant?.name ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function register(req: AuthenticatedRequest, res: Response): Promise<void> {
  const body = registerSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    throw new AppError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const freePlan = await prisma.plan.findUnique({ where: { code: 'FREE' } });

  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      name: body.name ?? null,
      role: 'INDIVIDUAL',
      ...(freePlan
        ? {
            subscription: {
              create: {
                planId: freePlan.id,
                status: 'ACTIVE',
                source: 'ADMIN',
              },
            },
          }
        : {}),
    },
  });

  const formatted = await formatUser(user);
  const token = signToken(user.id, user.email, user.role, formatted.tenantId);
  res.status(201).json({ user: formatted, token });
}

export async function registerTenant(req: AuthenticatedRequest, res: Response): Promise<void> {
  throw new AppError(403, 'Tenant accounts are created by platform admins');
}

export async function upgradeToTenant(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  throw new AppError(403, 'Contact the platform admin to become a tutor');
}

export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
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

  const passwordHash = await bcrypt.hash(body.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.json({ ok: true });
}
