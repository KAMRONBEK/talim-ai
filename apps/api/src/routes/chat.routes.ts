import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as chatController from '../controllers/chat.controller.js';

export const chatRoutes = Router();

chatRoutes.use(authMiddleware);
chatRoutes.get('/sessions/:sessionId/messages', asyncHandler(chatController.getMessages));
chatRoutes.post('/stream', asyncHandler(chatController.streamChat));
