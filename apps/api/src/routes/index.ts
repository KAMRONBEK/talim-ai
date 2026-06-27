import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { contentRoutes } from './content.routes.js';
import { chatRoutes } from './chat.routes.js';
import { quizRoutes } from './quiz.routes.js';
import { summaryRoutes } from './summary.routes.js';
import { adminRoutes } from './admin.routes.js';
import { usageRoutes } from './usage.routes.js';
import { billingRoutes } from './billing.routes.js';
import { tenantRoutes } from './tenant.routes.js';
import { learnerRoutes } from './learner.routes.js';
import { eventsRoutes } from './events.routes.js';

export const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

routes.use('/auth', authRoutes);
routes.use('/content', contentRoutes);
routes.use('/chat', chatRoutes);
routes.use('/quiz', quizRoutes);
routes.use('/summary', summaryRoutes);
routes.use('/admin', adminRoutes);
routes.use('/usage', usageRoutes);
routes.use('/billing', billingRoutes);
routes.use('/tenant', tenantRoutes);
routes.use('/learner', learnerRoutes);
routes.use('/events', eventsRoutes);
