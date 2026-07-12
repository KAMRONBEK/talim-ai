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
    // A non-learner (e.g. a TENANT_OWNER) may preview learner views (GET), but must never
    // submit attempts or otherwise act as a student on the /learner surface.
    if (req.method !== 'GET') {
      res.status(403).json({ message: 'Only students can take assessments' });
      return;
    }
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
  if (req.user.role === 'TENANT_LEARNER') {
    // Learners may read, submit a quiz attempt, and update their reading progress — but not
    // upload, generate, create, or otherwise modify content (apps/api/CLAUDE.md §3 "Learner
    // mutations blocked except submit/progress semantics").
    const isQuizSubmit = req.method === 'POST' && req.path.includes('/submit');
    const isProgressPatch = req.method === 'PATCH' && req.path.includes('/progress');
    // Grading a flashcard (SRS spaced-repetition review) is a learner-permitted mutation,
    // like submitting a quiz — it only writes the learner's own per-card review state.
    const isFlashcardReview =
      req.method === 'POST' && req.path.includes('/flashcards/') && req.path.endsWith('/review');
    // Checking one written answer (AI-backed instant feedback) is part of taking a quiz,
    // like submitting — it never mutates content.
    const isAnswerCheck = req.method === 'POST' && req.path.endsWith('/check-answer');
    if (
      req.method !== 'GET' &&
      !isQuizSubmit &&
      !isProgressPatch &&
      !isFlashcardReview &&
      !isAnswerCheck
    ) {
      res.status(403).json({ message: 'Learners cannot upload, generate, or modify content' });
      return;
    }
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
