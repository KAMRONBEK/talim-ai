import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { getSystemHealth, invalidateHealthCache } from '../../services/health/health.service.js';
import { reconcileStuckMediaClaims } from '../../services/mediaReconciler.service.js';
import { writeAdminAuditLog } from '../../services/admin/audit.service.js';

// NOT z.coerce.boolean(): that is `Boolean(value)`, so "false" and "0" both come
// through as true. Match the truthy spellings explicitly instead.
const systemHealthSchema = z.object({
  refresh: z
    .enum(['1', 'true', 'yes', '0', 'false', 'no'])
    .optional()
    .transform((value) => value === '1' || value === 'true' || value === 'yes'),
});

/**
 * Fast health pass. Read-only and free (bar one ~2-token embedding), so it is not
 * audit-logged — the admin page polls it once a minute.
 */
export async function getSystemHealthReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const query = systemHealthSchema.parse(req.query);
  const report = await getSystemHealth('fast', { refresh: query.refresh ?? false });
  res.json(report);
}

/**
 * Deep pass — makes real, metered calls to every configured provider. Audit-logged
 * because it spends money, and rate-limited server-side inside the health service.
 */
export async function runDeepHealthCheck(req: AuthenticatedRequest, res: Response): Promise<void> {
  const report = await getSystemHealth('deep');
  if (req.user) {
    await writeAdminAuditLog({
      adminUserId: req.user.userId,
      action: 'health.deep_check',
      targetType: 'system',
      metadata: { verdict: report.verdict, issueCount: report.issueCount, durationMs: report.durationMs },
    });
  }
  res.json(report);
}

/**
 * Repair action: flip orphaned in-flight media claims to FAILED so they become
 * retryable. Returns a freshly probed report so the page reflects the repair.
 */
export async function reconcileStuckJobs(req: AuthenticatedRequest, res: Response): Promise<void> {
  await reconcileStuckMediaClaims();
  if (req.user) {
    await writeAdminAuditLog({
      adminUserId: req.user.userId,
      action: 'health.reconcile_stuck',
      targetType: 'system',
    });
  }
  invalidateHealthCache();
  const report = await getSystemHealth('fast', { refresh: true });
  res.json({ reconciled: true, report });
}
