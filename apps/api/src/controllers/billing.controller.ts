import type { Response } from 'express';
import type { UserSubscription } from '@talim/types';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import {
  getSubscriptionForUser,
  getUsageVsLimits,
  getTenantUsageVsLimits,
} from '../services/subscription.service.js';

export async function getBillingMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');

  if (req.user.role === 'TENANT_OWNER' && req.user.tenantId) {
    const tenantUsage = await getTenantUsageVsLimits(req.user.tenantId);
    res.json({
      subscription: tenantUsage.subscription as UserSubscription | null,
      usage: {
        uploads: tenantUsage.uploads,
        generations: tenantUsage.generations,
        tutorMessages: tenantUsage.tutorMessages,
        videos: tenantUsage.videos,
        students: tenantUsage.students,
        contentItems: tenantUsage.contentItems,
      },
      periodStart: tenantUsage.periodStart,
      periodEnd: tenantUsage.periodEnd,
      tenantId: req.user.tenantId,
    });
    return;
  }

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
      videos: usageVsLimits.videos,
    },
    periodStart: usageVsLimits.periodStart,
    periodEnd: usageVsLimits.periodEnd,
  });
}
