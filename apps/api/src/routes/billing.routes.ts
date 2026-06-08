import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as billingController from '../controllers/billing.controller.js';

export const billingRoutes = Router();

billingRoutes.use(authMiddleware);
billingRoutes.get('/me', asyncHandler(billingController.getBillingMe));
