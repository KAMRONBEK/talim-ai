import type { Response, NextFunction } from 'express';
import { AppError } from './error.middleware.js';
import type { AuthenticatedRequest } from './auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { resolveTenantIdForUser } from '../services/contentAccess.service.js';

export async function attachTenantId(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    next();
    return;
  }
  if (!req.user.tenantId) {
    const tenantId = await resolveTenantIdForUser(req.user.userId, req.user.role);
    if (tenantId) req.user.tenantId = tenantId;
  }
  next();
}

export function requireTenantOwner(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  if (req.user.role !== 'TENANT_OWNER' || !req.user.tenantId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
}

export function requireTenantMember(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  if (
    (req.user.role !== 'TENANT_OWNER' && req.user.role !== 'TENANT_LEARNER') ||
    !req.user.tenantId
  ) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
}

export async function requireActiveLearner(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  if (req.user.role !== 'TENANT_LEARNER') {
    next();
    return;
  }
  if (!req.user.tenantId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  const membership = await prisma.tenantMembership.findFirst({
    where: {
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      role: 'LEARNER',
      active: true,
    },
  });
  if (!membership) {
    res.status(403).json({ message: 'Student account is deactivated' });
    return;
  }
  next();
}

export function blockIndividualContentForOwner(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  if (req.user.role === 'TENANT_OWNER') {
    res.status(403).json({ message: 'Use /api/tenant/content for organization materials' });
    return;
  }
  next();
}

export function blockLearnerMutations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  if (req.user.role === 'TENANT_LEARNER' && req.method !== 'GET' && req.method !== 'PATCH') {
    res.status(403).json({ message: 'Learners cannot upload or generate content' });
    return;
  }
  if (
    req.user.role === 'TENANT_LEARNER' &&
    req.method === 'PATCH' &&
    !req.path.includes('/progress')
  ) {
    res.status(403).json({ message: 'Learners cannot modify content' });
    return;
  }
  next();
}

export function requireTenantId(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user?.tenantId) {
    throw new AppError(403, 'Organization context required');
  }
  next();
}
