import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { attachTenantId, blockLearnerMutations } from '../middleware/tenant.middleware.js';
import * as summaryController from '../controllers/summary.controller.js';

export const summaryRoutes = Router();

summaryRoutes.use(authMiddleware, attachTenantId, blockLearnerMutations);
summaryRoutes.get('/:contentId', asyncHandler(summaryController.getSummary));
summaryRoutes.post('/:contentId', asyncHandler(summaryController.generateSummary));
