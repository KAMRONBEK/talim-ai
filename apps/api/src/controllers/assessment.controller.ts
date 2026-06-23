import type { Response } from 'express';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getParam } from '../lib/params.js';
import * as assessmentService from '../services/assessment.service.js';

function requireTenant(req: AuthenticatedRequest): { tenantId: string; userId: string } {
  if (!req.user?.tenantId) throw new AppError(403, 'Organization context required');
  return { tenantId: req.user.tenantId, userId: req.user.userId };
}

export async function listBanks(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId } = requireTenant(req);
  res.json({ banks: await assessmentService.listBanks(tenantId) });
}

export async function createBank(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId, userId } = requireTenant(req);
  const bank = await assessmentService.createBank(tenantId, userId, req.body);
  res.status(201).json({ bank });
}

export async function listQuestions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId } = requireTenant(req);
  const questions = await assessmentService.listQuestions(tenantId, getParam(req, 'bankId'));
  res.json({ questions });
}

export async function generateQuestions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId, userId } = requireTenant(req);
  const questions = await assessmentService.generateQuestions(
    tenantId,
    userId,
    getParam(req, 'bankId'),
    req.body,
  );
  res.status(201).json({ questions });
}

export async function patchQuestion(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId } = requireTenant(req);
  const question = await assessmentService.patchQuestion(
    tenantId,
    getParam(req, 'bankId'),
    getParam(req, 'questionId'),
    req.body,
  );
  res.json({ question });
}

export async function listAssessments(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId } = requireTenant(req);
  res.json({ assessments: await assessmentService.listAssessments(tenantId) });
}

export async function createAssessment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId, userId } = requireTenant(req);
  const assessment = await assessmentService.createAssessment(tenantId, userId, req.body);
  res.status(201).json({ assessment });
}

export async function assignAssessment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId, userId } = requireTenant(req);
  const assignments = await assessmentService.assignAssessment(
    tenantId,
    userId,
    getParam(req, 'assessmentId'),
    req.body,
  );
  res.status(201).json({ assignments });
}

export async function assessmentResults(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId } = requireTenant(req);
  res.json(await assessmentService.getAssessmentResults(tenantId, getParam(req, 'assessmentId')));
}

export async function assessmentLeaderboard(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { tenantId } = requireTenant(req);
  res.json(await assessmentService.getAssessmentLeaderboard(tenantId, getParam(req, 'assessmentId')));
}

export async function learnerAssessmentLeaderboard(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { tenantId, userId } = requireTenant(req);
  res.json(
    await assessmentService.getLearnerAssessmentLeaderboard(
      tenantId,
      userId,
      getParam(req, 'assessmentId'),
    ),
  );
}

export async function listLearnerAssessments(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { tenantId, userId } = requireTenant(req);
  const assessments = await assessmentService.listLearnerAssessments(tenantId, userId);
  res.json({ assessments });
}

export async function submitLearnerAssessment(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { tenantId, userId } = requireTenant(req);
  const result = await assessmentService.submitLearnerAssessment(
    tenantId,
    userId,
    getParam(req, 'assessmentId'),
    req.body,
  );
  res.status(201).json(result);
}
