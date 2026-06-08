import type { RequestHandler } from 'express';
import type { QuotaFeature } from '@talim/types';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from './error.middleware.js';
import type { AuthenticatedRequest } from './auth.middleware.js';
import { assertQuota } from '../services/subscription.service.js';

export function enforceQuota(...features: QuotaFeature[]): RequestHandler {
  return asyncHandler(async (req: AuthenticatedRequest, _res, next) => {
    if (!req.user) throw new AppError(401, 'Unauthorized');
    for (const feature of features) {
      await assertQuota(req.user.userId, feature, { role: req.user.role });
    }
    next();
  });
}
