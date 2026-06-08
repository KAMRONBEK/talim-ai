import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as usageController from '../controllers/usage.controller.js';

export const usageRoutes = Router();

usageRoutes.use(authMiddleware);
usageRoutes.get('/me', asyncHandler(usageController.getMyUsage));
