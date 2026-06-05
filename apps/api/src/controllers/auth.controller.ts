import type { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { parseAppLocale } from '@talim/types';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateMeSchema = z.object({
  preferredLocale: z.enum(['uz', 'en', 'ru']).optional(),
  name: z.string().min(1).optional(),
});

function signToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, env.JWT_SECRET, { expiresIn: '7d' });
}

function formatUser(user: {
  id: string;
  email: string;
  name: string | null;
  preferredLocale: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    preferredLocale: parseAppLocale(user.preferredLocale),
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
  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      name: body.name ?? null,
    },
  });

  const token = signToken(user.id, user.email);
  res.status(201).json({ user: formatUser(user), token });
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

  const token = signToken(user.id, user.email);
  res.json({ user: formatUser(user), token });
}

export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  res.json({ user: formatUser(user) });
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

  res.json({ user: formatUser(user) });
}
