import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { resolveTenantIdForUser } from '../services/contentAccess.service.js';

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
  /** True when the JWT was issued before `role` was embedded in tokens. */
  legacyToken?: boolean;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.legacyToken = !payload.role;

    if (!payload.role) {
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      payload.role = user.role;
    }

    if (
      !payload.tenantId &&
      (payload.role === 'TENANT_OWNER' || payload.role === 'TENANT_LEARNER')
    ) {
      const tenantId = await resolveTenantIdForUser(payload.userId, payload.role);
      if (tenantId) payload.tenantId = tenantId;
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    next();
  };
}
