import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { enforceQuota } from '../middleware/quota.middleware.js';
import * as chatController from '../controllers/chat.controller.js';

export const chatRoutes = Router();

chatRoutes.use(authMiddleware);
chatRoutes.get('/content/:contentId/messages', asyncHandler(chatController.getContentChat));
chatRoutes.get('/sessions/:sessionId/messages', asyncHandler(chatController.getMessages));
chatRoutes.get('/visual/manim/:jobId/asset', asyncHandler(chatController.getManimAsset));
chatRoutes.post('/stream', enforceQuota('TUTOR_MESSAGE'), asyncHandler(chatController.streamChat));
