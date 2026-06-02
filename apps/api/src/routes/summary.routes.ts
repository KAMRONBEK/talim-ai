import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as summaryController from '../controllers/summary.controller.js';

export const summaryRoutes = Router();

summaryRoutes.use(authMiddleware);
summaryRoutes.post('/:contentId', asyncHandler(summaryController.generateSummary));
