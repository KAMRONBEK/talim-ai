import type { Response } from 'express';
import { parseAppLocale } from '@talim/types';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getParam } from '../lib/params.js';
import * as tenantService from '../services/tenant.service.js';

function readLocale(req: AuthenticatedRequest) {
  return parseAppLocale(typeof req.query.locale === 'string' ? req.query.locale : null);
}

function requireTenant(req: AuthenticatedRequest): { tenantId: string; userId: string } {
  if (!req.user?.tenantId) throw new AppError(403, 'Organization context required');
  return { tenantId: req.user.tenantId, userId: req.user.userId };
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

export async function listMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId, userId } = requireTenant(req);
  const messages = await tenantService.listLearnerMessages(tenantId, userId);
  res.json({ messages });
}

export async function unreadMessageCount(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId, userId } = requireTenant(req);
  res.json(await tenantService.getLearnerUnreadCount(tenantId, userId));
}

export async function markMessageRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId, userId } = requireTenant(req);
  const result = await tenantService.markLearnerMessageRead(tenantId, userId, getParam(req, 'id'));
  res.json(result);
}

export async function replyToMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId, userId } = requireTenant(req);
  const reply = await tenantService.replyToTenantMessage(
    tenantId,
    userId,
    getParam(req, 'id'),
    req.body,
  );
  res.status(201).json({ reply });
}
