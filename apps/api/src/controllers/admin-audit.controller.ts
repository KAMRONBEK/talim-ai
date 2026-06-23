import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { listAdminAuditLogs } from '../services/admin/audit.service.js';

const schema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().optional(),
  targetType: z.string().optional(),
});

export async function listAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const query = schema.parse(req.query);
  res.json(await listAdminAuditLogs(query));
}
