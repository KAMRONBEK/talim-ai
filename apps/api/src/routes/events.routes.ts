import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { attachTenantId } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { streamEvents } from '../controllers/events.controller.js';

export const eventsRoutes = Router();

// One SSE stream per authenticated tab; events are scoped to the user.
eventsRoutes.get('/', authMiddleware, attachTenantId, asyncHandler(streamEvents));
