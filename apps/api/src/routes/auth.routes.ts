import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as authController from '../controllers/auth.controller.js';

export const authRoutes = Router();

authRoutes.post('/register', asyncHandler(authController.register));
authRoutes.post('/register-tenant', asyncHandler(authController.registerTenant));
authRoutes.post('/upgrade-to-tenant', authMiddleware, asyncHandler(authController.upgradeToTenant));
authRoutes.post('/login', asyncHandler(authController.login));
authRoutes.get('/me', authMiddleware, asyncHandler(authController.me));
authRoutes.patch('/me', authMiddleware, asyncHandler(authController.updateMe));
