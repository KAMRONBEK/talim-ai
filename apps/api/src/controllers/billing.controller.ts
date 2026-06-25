import type { Response } from 'express';
import type { UserSubscription } from '@talim/types';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import { prisma } from '../lib/prisma.js';
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
        podcasts: tenantUsage.podcasts,
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
      podcasts: usageVsLimits.podcasts,
    },
    periodStart: usageVsLimits.periodStart,
    periodEnd: usageVsLimits.periodEnd,
  });
}

/**
 * Self-serve "upgrade to Pro" request. Billing is manual (no payment gateway),
 * so this records a signal an admin can act on (activate the subscription) rather
 * than charging anything. Individuals only — tenant owners upgrade via admin.
 */
export async function requestUpgrade(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  if (req.user.role !== 'INDIVIDUAL') {
    throw new AppError(400, 'Only individual accounts can request a self-serve upgrade');
  }

  const subscription = await getSubscriptionForUser(req.user.userId);
  if (subscription.effectivePlanCode !== 'FREE') {
    res.json({ ok: true, alreadyPro: true });
    return;
  }

  // Surface the request in the admin audit log (the actor is the requester — a
  // manual-activation signal, not an admin action). Best-effort.
  await prisma.adminAuditLog
    .create({
      data: {
        adminUserId: req.user.userId,
        adminEmail: req.user.email,
        action: 'UPGRADE_REQUESTED',
        targetType: 'subscription',
        targetId: req.user.userId,
        metadata: { requestedPlan: 'INDIVIDUAL_PRO' },
      },
    })
    .catch(() => undefined);

  res.json({ ok: true });
}
