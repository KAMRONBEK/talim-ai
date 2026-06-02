import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import * as contentController from '../controllers/content.controller.js';

export const contentRoutes = Router();

contentRoutes.use(authMiddleware);
contentRoutes.get('/', asyncHandler(contentController.listContent));
contentRoutes.get('/:id', asyncHandler(contentController.getContent));
contentRoutes.post('/upload', upload.single('file'), asyncHandler(contentController.uploadContent));
contentRoutes.post('/youtube', asyncHandler(contentController.createYoutubeContent));
contentRoutes.delete('/:id', asyncHandler(contentController.deleteContent));
