import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authWriteRateLimit, loginRateLimit } from '../middleware/rate-limit.middleware.js';
import * as authController from '../controllers/auth.controller.js';

export const authRoutes = Router();

authRoutes.post('/register', authWriteRateLimit, asyncHandler(authController.register));
authRoutes.post('/register-tenant', asyncHandler(authController.registerTenant));
authRoutes.post(
  '/upgrade-to-tenant',
  authMiddleware,
  authWriteRateLimit,
  asyncHandler(authController.upgradeToTenant),
);
authRoutes.get('/tutor-request', authMiddleware, asyncHandler(authController.getTutorRequest));
authRoutes.post('/join-class', authMiddleware, authWriteRateLimit, asyncHandler(authController.joinClass));
authRoutes.post('/login', loginRateLimit, asyncHandler(authController.login));
authRoutes.get('/me', authMiddleware, asyncHandler(authController.me));
authRoutes.patch('/me', authMiddleware, asyncHandler(authController.updateMe));
authRoutes.patch(
  '/me/password',
  authMiddleware,
  authWriteRateLimit,
  asyncHandler(authController.changePassword),
);
