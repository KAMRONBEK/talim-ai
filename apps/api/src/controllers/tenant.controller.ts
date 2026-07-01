import type { Response } from 'express';
import { parseAppLocale } from '@talim/types';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getParam } from '../lib/params.js';
import * as tenantService from '../services/tenant.service.js';
import * as masteryService from '../services/mastery.service.js';

function requireOwnerTenant(req: AuthenticatedRequest): string {
  if (!req.user?.tenantId) throw new AppError(403, 'Organization context required');
  return req.user.tenantId;
}

function readLocale(req: AuthenticatedRequest) {
  return parseAppLocale(typeof req.query.locale === 'string' ? req.query.locale : null);
}

export async function getTenant(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const tenant = await tenantService.getTenantForOwner(req.user.userId);
  res.json({ tenant });
}

export async function patchTenant(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const tenant = await tenantService.patchTenantForOwner(req.user.userId, req.body ?? {});
  res.json({ tenant });
}

export async function regenerateJoinCode(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const tenant = await tenantService.regenerateJoinCode(req.user.userId);
  res.json({ tenant });
}

export async function listStudents(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = requireOwnerTenant(req);
  const students = await tenantService.listStudents(tenantId);
  res.json({ students });
}

export async function getProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = requireOwnerTenant(req);
  const progress = await tenantService.getTenantProgress(tenantId, readLocale(req));
  res.json(progress);
}

export async function getProgressTopics(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = requireOwnerTenant(req);
  const topics = await masteryService.getClassMastery(tenantId, { locale: readLocale(req) });
  res.json(topics);
}

export async function createStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const tenantId = requireOwnerTenant(req);
  const result = await tenantService.createStudent(tenantId, req.user.userId, req.body);
  res.status(201).json(result);
}

export async function importStudents(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const tenantId = requireOwnerTenant(req);
  const result = await tenantService.importStudents(tenantId, req.user.userId, req.body);
  res.json(result);
}

export async function sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const tenantId = requireOwnerTenant(req);
  const message = await tenantService.sendTenantMessage(tenantId, req.user.userId, req.body);
  res.status(201).json({ message });
}

export async function listSentMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const tenantId = requireOwnerTenant(req);
  const messages = await tenantService.listSentMessages(tenantId, req.user.userId);
  res.json({ messages });
}

export async function patchStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = requireOwnerTenant(req);
  const student = await tenantService.patchStudent(tenantId, getParam(req, 'id'), req.body);
  res.json({ student });
}

export async function deleteStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = requireOwnerTenant(req);
  await tenantService.deleteStudent(tenantId, getParam(req, 'id'));
  res.status(204).send();
}

export async function resetStudentPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = requireOwnerTenant(req);
  const result = await tenantService.resetStudentPassword(tenantId, getParam(req, 'id'));
  res.json(result);
}

export async function getStudentProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = requireOwnerTenant(req);
  const progress = await tenantService.getStudentProgress(
    tenantId,
    getParam(req, 'id'),
    readLocale(req),
  );
  res.json(progress);
}

export async function assignContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const tenantId = requireOwnerTenant(req);
  const assignment = await tenantService.assignContent(tenantId, req.user.userId, req.body);
  res.status(201).json({ assignment });
}

export async function unassignContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = requireOwnerTenant(req);
  await tenantService.unassignContent(tenantId, req.body);
  res.status(204).send();
}

export async function listContentAssignments(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const tenantId = requireOwnerTenant(req);
  const assignments = await tenantService.listContentAssignments(
    tenantId,
    getParam(req, 'contentId'),
  );
  res.json({ assignments });
}
