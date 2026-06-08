import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import { getSubscriptionForUser, getUsageVsLimits } from '../services/subscription.service.js';

export async function getBillingMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');

  const userId = req.user.userId;
  const [subscription, usageVsLimits] = await Promise.all([
    getSubscriptionForUser(userId),
    getUsageVsLimits(userId),
  ]);

  res.json({
    subscription,
    usage: {
      uploads: usageVsLimits.uploads,
      generations: usageVsLimits.generations,
      tutorMessages: usageVsLimits.tutorMessages,
    },
    periodStart: usageVsLimits.periodStart,
    periodEnd: usageVsLimits.periodEnd,
  });
}
