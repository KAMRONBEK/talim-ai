import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { adminRateLimit } from '../middleware/admin-rate-limit.middleware.js';
import * as adminController from '../controllers/admin.controller.js';

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireRole('ADMIN'), adminRateLimit);

adminRoutes.get('/users', asyncHandler(adminController.listUsers));
adminRoutes.post('/users', asyncHandler(adminController.createUser));
adminRoutes.get('/users/:id', asyncHandler(adminController.getUser));
adminRoutes.patch('/users/:id', asyncHandler(adminController.patchUser));
adminRoutes.delete('/users/:id', asyncHandler(adminController.deleteUser));
adminRoutes.post('/users/:id/reset-password', asyncHandler(adminController.resetUserPassword));

adminRoutes.get('/tenants', asyncHandler(adminController.listTenants));
adminRoutes.get('/tenants/:id', asyncHandler(adminController.getTenant));
adminRoutes.patch('/tenants/:id', asyncHandler(adminController.patchTenant));

adminRoutes.get('/contents', asyncHandler(adminController.listContents));
adminRoutes.delete('/contents/:id', asyncHandler(adminController.deleteContent));
adminRoutes.post('/contents/:id/retry-job', asyncHandler(adminController.retryContentJob));

adminRoutes.get('/generated', asyncHandler(adminController.listGenerated));
adminRoutes.delete('/generated/:id', asyncHandler(adminController.deleteGenerated));

adminRoutes.get('/subscriptions', asyncHandler(adminController.listSubscriptions));
adminRoutes.get('/usage/summary', asyncHandler(adminController.usageSummary));
adminRoutes.get('/stats/platform', asyncHandler(adminController.platformStats));
