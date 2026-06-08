import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import { getUsageForPeriod } from '../services/usage.service.js';

function monthToDateRange(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth(), 1);
  return { from, to };
}

export async function getMyUsage(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');

  const { from, to } = monthToDateRange();
  const usage = await getUsageForPeriod({ userId: req.user.userId, from, to });

  res.json({
    periodStart: from.toISOString(),
    periodEnd: to.toISOString(),
    totalInputTokens: usage.totalInputTokens,
    totalOutputTokens: usage.totalOutputTokens,
    totalCostUsd: usage.totalCostUsd,
    eventCount: usage.eventCount,
    byFeature: Object.fromEntries(
      Object.entries(usage.byFeature).map(([feature, stats]) => [
        feature,
        {
          count: stats.count,
          inputTokens: stats.inputTokens,
          outputTokens: stats.outputTokens,
          costUsd: Number(stats.costUsd.toFixed(6)),
        },
      ]),
    ),
  });
}
