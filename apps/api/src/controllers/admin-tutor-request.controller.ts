import type { Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getParam } from '../lib/params.js';
import { writeAdminAuditLog } from '../services/admin/audit.service.js';
import * as tutorRequestService from '../services/tutorRequest.service.js';

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});

export async function listTutorRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  const query = listSchema.parse(req.query);
  res.json(await tutorRequestService.listTutorRequests(query));
}

export async function approveTutorRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const id = getParam(req, 'id');
  const result = await tutorRequestService.approveTutorRequest(id, req.user.userId, req.body);
  await writeAdminAuditLog({
    adminUserId: req.user.userId,
    action: 'tutor_request.approve',
    targetType: 'tutor_request',
    targetId: id,
    metadata: { tenantId: result.tenantId, userId: result.request.userId },
  });
  res.json(result);
}

export async function rejectTutorRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const id = getParam(req, 'id');
  const note = typeof req.body?.note === 'string' ? req.body.note : undefined;
  const request = await tutorRequestService.rejectTutorRequest(id, req.user.userId, note);
  await writeAdminAuditLog({
    adminUserId: req.user.userId,
    action: 'tutor_request.reject',
    targetType: 'tutor_request',
    targetId: id,
  });
  res.json({ request });
}
