import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { attachTenantId, blockLearnerMutations } from '../middleware/tenant.middleware.js';
import { answerCheckRateLimit } from '../middleware/rate-limit.middleware.js';
import * as quizController from '../controllers/quiz.controller.js';

export const quizRoutes = Router();

quizRoutes.use(authMiddleware, attachTenantId, blockLearnerMutations);
quizRoutes.get('/content/:contentId/mastery', asyncHandler(quizController.getContentMastery));
quizRoutes.get('/content/:contentId', asyncHandler(quizController.listQuizzesByContent));
quizRoutes.post('/content/:contentId', asyncHandler(quizController.createQuiz));
quizRoutes.get('/:id/attempts/latest', asyncHandler(quizController.getLatestAttempt));
quizRoutes.get('/:id/attempts', asyncHandler(quizController.listAttempts));
quizRoutes.get('/:id', asyncHandler(quizController.getQuiz));
quizRoutes.post('/:id/submit', asyncHandler(quizController.submitQuiz));
quizRoutes.post('/:id/check-answer', answerCheckRateLimit, asyncHandler(quizController.checkAnswer));
