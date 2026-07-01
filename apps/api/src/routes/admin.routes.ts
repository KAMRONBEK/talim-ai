import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { adminRateLimit } from '../middleware/admin-rate-limit.middleware.js';
import * as adminController from '../controllers/admin.controller.js';
import * as tutorRequestController from '../controllers/admin-tutor-request.controller.js';
import * as auditController from '../controllers/admin-audit.controller.js';

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireRole('ADMIN'), adminRateLimit);

adminRoutes.get('/audit-logs', asyncHandler(auditController.listAuditLogs));
adminRoutes.get('/tutor-requests', asyncHandler(tutorRequestController.listTutorRequests));
adminRoutes.post('/tutor-requests/:id/approve', asyncHandler(tutorRequestController.approveTutorRequest));
adminRoutes.post('/tutor-requests/:id/reject', asyncHandler(tutorRequestController.rejectTutorRequest));

adminRoutes.get('/analytics/summary', asyncHandler(adminController.analyticsSummary));
adminRoutes.get('/analytics/mrr', asyncHandler(adminController.analyticsMrr));
adminRoutes.get('/analytics/user-growth', asyncHandler(adminController.analyticsUserGrowth));
adminRoutes.get('/analytics/by-role', asyncHandler(adminController.analyticsByRole));
adminRoutes.get('/analytics/funnel', asyncHandler(adminController.analyticsFunnel));
adminRoutes.get('/analytics/content-by-type', asyncHandler(adminController.analyticsContentByType));
adminRoutes.get('/analytics/top-orgs', asyncHandler(adminController.analyticsTopOrgs));
adminRoutes.get('/analytics/spend-by-model', asyncHandler(adminController.analyticsSpendByModel));

adminRoutes.get('/users', asyncHandler(adminController.listUsers));
adminRoutes.post('/users', asyncHandler(adminController.createUser));
adminRoutes.get('/users/:id', asyncHandler(adminController.getUser));
adminRoutes.patch('/users/:id', asyncHandler(adminController.patchUser));
adminRoutes.delete('/users/:id', asyncHandler(adminController.deleteUser));
adminRoutes.post('/users/:id/reset-password', asyncHandler(adminController.resetUserPassword));
adminRoutes.patch('/users/:id/subscription', asyncHandler(adminController.patchUserSubscription));
adminRoutes.post('/users/:id/impersonate', asyncHandler(adminController.impersonateUser));

adminRoutes.get('/tenants', asyncHandler(adminController.listTenants));
adminRoutes.get('/tenants/:id', asyncHandler(adminController.getTenant));
adminRoutes.patch('/tenants/:id', asyncHandler(adminController.patchTenant));

adminRoutes.get('/contents', asyncHandler(adminController.listContents));
adminRoutes.delete('/contents/:id', asyncHandler(adminController.deleteContent));
adminRoutes.post('/contents/:id/retry-job', asyncHandler(adminController.retryContentJob));
adminRoutes.get('/content/:id/detail', asyncHandler(adminController.contentDetail));

adminRoutes.get('/generated', asyncHandler(adminController.listGenerated));
adminRoutes.delete('/generated/:id', asyncHandler(adminController.deleteGenerated));
adminRoutes.post('/generated/:kind/:mediaId/review', asyncHandler(adminController.reviewGenerated));

adminRoutes.get('/subscriptions', asyncHandler(adminController.listSubscriptions));
adminRoutes.get('/usage/summary', asyncHandler(adminController.usageSummary));
adminRoutes.get('/stats/platform', asyncHandler(adminController.platformStats));
