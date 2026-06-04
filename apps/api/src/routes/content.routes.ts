import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import * as contentController from '../controllers/content.controller.js';
import * as sectionController from '../controllers/section.controller.js';
import * as podcastController from '../controllers/podcast.controller.js';

export const contentRoutes = Router();

contentRoutes.use(authMiddleware);
contentRoutes.get('/', asyncHandler(contentController.listContent));
contentRoutes.get('/:id/sections', asyncHandler(sectionController.listSections));
contentRoutes.get('/:id/sections/:sectionId', asyncHandler(sectionController.getSection));
contentRoutes.get('/:id/file', asyncHandler(contentController.getContentFile));
contentRoutes.get('/:id/podcast', asyncHandler(podcastController.getPodcast));
contentRoutes.post('/:id/podcast', asyncHandler(podcastController.createPodcast));
contentRoutes.get('/:id/podcast/episodes/:episodeId/audio', asyncHandler(podcastController.streamEpisodeAudio));
contentRoutes.get('/:id', asyncHandler(contentController.getContent));
contentRoutes.post('/upload', upload.single('file'), asyncHandler(contentController.uploadContent));
contentRoutes.post('/youtube', asyncHandler(contentController.createYoutubeContent));
contentRoutes.post('/:id/retry', asyncHandler(contentController.retryContent));
contentRoutes.delete('/:id', asyncHandler(contentController.deleteContent));
