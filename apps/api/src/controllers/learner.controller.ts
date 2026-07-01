import type { Response } from 'express';
import { parseAppLocale } from '@talim/types';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as tenantService from '../services/tenant.service.js';

function readLocale(req: AuthenticatedRequest) {
  return parseAppLocale(typeof req.query.locale === 'string' ? req.query.locale : null);
}

export async function getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const summary = await tenantService.getLearnerSummary(req.user.userId);
  res.json({ summary });
}

export async function getMaterials(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const materials = await tenantService.getLearnerMaterials(req.user.userId);
  res.json({ materials });
}

export async function getProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const progress = await tenantService.getLearnerProgress(req.user.userId, readLocale(req));
  res.json(progress);
}
