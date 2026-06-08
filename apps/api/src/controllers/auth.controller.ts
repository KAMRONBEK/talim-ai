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
import { createTenantForOwner } from '../services/tenant.service.js';
import { resolveTenantIdForUser } from '../services/contentAccess.service.js';

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).optional(),
    role: z.never().optional(),
  })
  .strict();

const registerTenantSchema = z.object({
  orgName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

const upgradeTenantSchema = z.object({
  orgName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateMeSchema = z.object({
  preferredLocale: z.enum(['uz', 'en', 'ru']).optional(),
  name: z.string().min(1).optional(),
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
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    preferredLocale: parseAppLocale(user.preferredLocale),
    tenantId,
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
  const body = registerTenantSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    throw new AppError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(body.password, 12);

  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      name: body.name ?? null,
      role: 'TENANT_OWNER',
    },
  });

  const { tenantId } = await createTenantForOwner(user.id, body.orgName);
  const formatted = await formatUser(user);
  const token = signToken(user.id, user.email, user.role, tenantId);
  res.status(201).json({ user: { ...formatted, tenantId }, token });
}

export async function upgradeToTenant(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const body = upgradeTenantSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) throw new AppError(404, 'User not found');
  if (user.role !== 'INDIVIDUAL') {
    throw new AppError(400, 'Only individual accounts can upgrade to an organization');
  }

  const existingTenant = await prisma.tenant.findFirst({ where: { ownerId: user.id } });
  if (existingTenant) throw new AppError(409, 'Organization already exists');

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'TENANT_OWNER' },
  });

  const { tenantId } = await createTenantForOwner(user.id, body.orgName);
  const formatted = await formatUser(updated);
  const token = signToken(updated.id, updated.email, updated.role, tenantId);
  res.json({ user: { ...formatted, tenantId }, token });
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
  res.json({ user: await formatUser(user) });
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
