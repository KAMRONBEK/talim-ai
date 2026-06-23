import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  attachTenantId,
  blockIndividualContentForOwner,
  blockLearnerMutations,
} from '../middleware/tenant.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { enforceQuota } from '../middleware/quota.middleware.js';
import * as contentController from '../controllers/content.controller.js';
import * as sectionController from '../controllers/section.controller.js';
import * as podcastController from '../controllers/podcast.controller.js';
import * as progressController from '../controllers/progress.controller.js';
import * as videoController from '../controllers/video.controller.js';
import * as slidesController from '../controllers/slides.controller.js';

export const contentRoutes = Router();

contentRoutes.use(authMiddleware, attachTenantId, blockIndividualContentForOwner);
contentRoutes.use(blockLearnerMutations);
contentRoutes.get('/', asyncHandler(contentController.listContent));
contentRoutes.get('/:id/progress', asyncHandler(progressController.getContentProgress));
contentRoutes.patch('/:id/progress', asyncHandler(progressController.patchContentProgress));
contentRoutes.get('/:id/learning-history', asyncHandler(progressController.getLearningHistory));
contentRoutes.get('/:id/podcast/progress', asyncHandler(progressController.getEpisodeProgress));
contentRoutes.get('/:id/sections', asyncHandler(sectionController.listSections));
contentRoutes.get('/:id/sections/:sectionId', asyncHandler(sectionController.getSection));
contentRoutes.get('/:id/transcript', asyncHandler(contentController.getContentTranscript));
contentRoutes.get('/:id/file', asyncHandler(contentController.getContentFile));
contentRoutes.post('/:id/ocr-region', asyncHandler(contentController.ocrPdfRegion));
contentRoutes.get('/:id/podcast', asyncHandler(podcastController.getPodcast));
contentRoutes.post('/:id/podcast', asyncHandler(podcastController.createPodcast));
contentRoutes.get('/:id/video', asyncHandler(videoController.getVideo));
contentRoutes.post('/:id/video', asyncHandler(videoController.createVideo));
contentRoutes.get('/:id/slides', asyncHandler(slidesController.getSlides));
contentRoutes.post('/:id/slides', asyncHandler(slidesController.createSlides));
contentRoutes.patch(
  '/:id/podcast/episodes/:episodeId/progress',
  asyncHandler(progressController.patchEpisodeProgress),
);
contentRoutes.get('/:id/podcast/episodes/:episodeId/audio', asyncHandler(podcastController.streamEpisodeAudio));
contentRoutes.get('/:id', asyncHandler(contentController.getContent));
contentRoutes.post(
  '/upload',
  upload.single('file'),
  enforceQuota('UPLOAD', 'GENERATION'),
  asyncHandler(contentController.uploadContent),
);
contentRoutes.post(
  '/youtube',
  enforceQuota('UPLOAD', 'GENERATION'),
  asyncHandler(contentController.createYoutubeContent),
);
contentRoutes.post('/:id/retry', asyncHandler(contentController.retryContent));
contentRoutes.delete('/:id', asyncHandler(contentController.deleteContent));
