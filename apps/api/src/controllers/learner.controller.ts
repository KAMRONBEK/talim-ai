import type { Response } from 'express';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as tenantService from '../services/tenant.service.js';

export async function getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const summary = await tenantService.getLearnerSummary(req.user.userId);
  res.json({ summary });
}
