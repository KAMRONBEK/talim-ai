import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { attachTenantId, blockLearnerMutations } from '../middleware/tenant.middleware.js';
import * as summaryController from '../controllers/summary.controller.js';

export const summaryRoutes = Router();

summaryRoutes.use(authMiddleware, attachTenantId, blockLearnerMutations);
summaryRoutes.get('/:contentId', asyncHandler(summaryController.getSummary));
summaryRoutes.post('/:contentId', asyncHandler(summaryController.generateSummary));
// Token-by-token SSE variant of the generate route (same guards via the router-level
// middleware above); the sync POST stays for fire-and-forget locale auto-generation.
summaryRoutes.post('/:contentId/stream', asyncHandler(summaryController.streamSummary));
