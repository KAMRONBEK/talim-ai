import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { contentRoutes } from './content.routes.js';
import { chatRoutes } from './chat.routes.js';
import { quizRoutes } from './quiz.routes.js';
import { summaryRoutes } from './summary.routes.js';

export const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

routes.use('/auth', authRoutes);
routes.use('/content', contentRoutes);
routes.use('/chat', chatRoutes);
routes.use('/quiz', quizRoutes);
routes.use('/summary', summaryRoutes);
