import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  attachTenantId,
  requireActiveLearner,
  requireTenantMember,
} from '../middleware/tenant.middleware.js';
import * as learnerController from '../controllers/learner.controller.js';
import * as assessmentController from '../controllers/assessment.controller.js';

export const learnerRoutes = Router();

learnerRoutes.use(authMiddleware, attachTenantId, requireTenantMember, requireActiveLearner);

learnerRoutes.get('/summary', asyncHandler(learnerController.getSummary));
learnerRoutes.get('/assessments', asyncHandler(assessmentController.listLearnerAssessments));
learnerRoutes.get(
  '/assessments/:assessmentId/leaderboard',
  asyncHandler(assessmentController.learnerAssessmentLeaderboard),
);
learnerRoutes.post(
  '/assessments/:assessmentId/attempts',
  asyncHandler(assessmentController.submitLearnerAssessment),
);
