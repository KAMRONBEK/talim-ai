import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as quizController from '../controllers/quiz.controller.js';

export const quizRoutes = Router();

quizRoutes.use(authMiddleware);
quizRoutes.post('/content/:contentId', asyncHandler(quizController.createQuiz));
quizRoutes.get('/:id', asyncHandler(quizController.getQuiz));
quizRoutes.post('/:id/submit', asyncHandler(quizController.submitQuiz));
