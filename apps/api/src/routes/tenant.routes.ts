import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { enforceQuota } from '../middleware/quota.middleware.js';
import { reparseRateLimit } from '../middleware/rate-limit.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import {
  attachTenantId,
  requireTenantOwner,
  requireTenantId,
} from '../middleware/tenant.middleware.js';
import * as tenantController from '../controllers/tenant.controller.js';
import * as tenantContentController from '../controllers/tenant-content.controller.js';
import * as assessmentController from '../controllers/assessment.controller.js';
import * as sectionController from '../controllers/section.controller.js';
import * as podcastController from '../controllers/podcast.controller.js';
import * as videoController from '../controllers/video.controller.js';
import * as flashcardsController from '../controllers/flashcards.controller.js';
import * as slidesController from '../controllers/slides.controller.js';
import * as progressController from '../controllers/progress.controller.js';

export const tenantRoutes = Router();

tenantRoutes.use(authMiddleware, attachTenantId, requireTenantOwner);

tenantRoutes.get('/', asyncHandler(tenantController.getTenant));
tenantRoutes.patch('/', asyncHandler(tenantController.patchTenant));
tenantRoutes.post('/join-code/regenerate', asyncHandler(tenantController.regenerateJoinCode));
tenantRoutes.get('/progress', asyncHandler(tenantController.getProgress));
tenantRoutes.get('/progress/topics', asyncHandler(tenantController.getProgressTopics));

tenantRoutes.get('/students', asyncHandler(tenantController.listStudents));
tenantRoutes.post('/students', asyncHandler(tenantController.createStudent));
tenantRoutes.post('/students/import', asyncHandler(tenantController.importStudents));
tenantRoutes.patch('/students/:id', asyncHandler(tenantController.patchStudent));
tenantRoutes.delete('/students/:id', asyncHandler(tenantController.deleteStudent));
tenantRoutes.post('/students/:id/reset-password', asyncHandler(tenantController.resetStudentPassword));
tenantRoutes.get('/students/:id/progress', asyncHandler(tenantController.getStudentProgress));

tenantRoutes.post('/assignments', asyncHandler(tenantController.assignContent));
tenantRoutes.delete('/assignments', asyncHandler(tenantController.unassignContent));
tenantRoutes.get(
  '/content/:contentId/assignments',
  asyncHandler(tenantController.listContentAssignments),
);

tenantRoutes.get('/question-banks', asyncHandler(assessmentController.listBanks));
tenantRoutes.post('/question-banks', asyncHandler(assessmentController.createBank));
tenantRoutes.get('/question-banks/:bankId/questions', asyncHandler(assessmentController.listQuestions));
tenantRoutes.post(
  '/question-banks/:bankId/generate',
  enforceQuota('GENERATION'),
  asyncHandler(assessmentController.generateQuestions),
);
tenantRoutes.patch(
  '/question-banks/:bankId/questions/:questionId',
  asyncHandler(assessmentController.patchQuestion),
);
tenantRoutes.get('/assessments', asyncHandler(assessmentController.listAssessments));
tenantRoutes.post('/assessments', asyncHandler(assessmentController.createAssessment));
tenantRoutes.get(
  '/assessments/:assessmentId/results',
  asyncHandler(assessmentController.assessmentResults),
);
tenantRoutes.get(
  '/assessments/:assessmentId/leaderboard',
  asyncHandler(assessmentController.assessmentLeaderboard),
);
tenantRoutes.post(
  '/assessments/:assessmentId/assign',
  asyncHandler(assessmentController.assignAssessment),
);
tenantRoutes.patch(
  '/assessments/:assessmentId/schedule',
  asyncHandler(assessmentController.scheduleAssessment),
);
tenantRoutes.post(
  '/assessments/:assessmentId/go-live',
  asyncHandler(assessmentController.goLiveAssessment),
);

// Two-way threaded tutor↔student messaging (Wave 3 area D). `/unread-count` before `/:id/read`.
tenantRoutes.get('/messages', asyncHandler(tenantController.listSentMessages));
tenantRoutes.post('/messages', asyncHandler(tenantController.sendMessage));
tenantRoutes.get('/messages/unread-count', asyncHandler(tenantController.messagesUnreadCount));
tenantRoutes.post('/messages/:id/read', asyncHandler(tenantController.markReplyRead));

const tenantContent = Router({ mergeParams: true });
tenantContent.use(requireTenantId);

tenantContent.get('/', asyncHandler(tenantContentController.listContent));
tenantContent.get('/:id', asyncHandler(tenantContentController.getContent));
tenantContent.post(
  '/upload',
  upload.single('file'),
  enforceQuota('UPLOAD', 'GENERATION'),
  asyncHandler(tenantContentController.uploadContent),
);
tenantContent.post(
  '/youtube',
  enforceQuota('UPLOAD', 'GENERATION'),
  asyncHandler(tenantContentController.createYoutubeContent),
);
tenantContent.post('/:id/retry', enforceQuota('GENERATION'), asyncHandler(tenantContentController.retryContent));
tenantContent.post('/:id/reparse', reparseRateLimit, asyncHandler(tenantContentController.reparseContent));
tenantContent.delete('/:id', asyncHandler(tenantContentController.deleteContent));
tenantContent.get('/:id/file', asyncHandler(tenantContentController.getContentFile));
tenantContent.post('/:id/ocr-region', asyncHandler(tenantContentController.ocrPdfRegion));
tenantContent.get('/:id/transcript', asyncHandler(tenantContentController.getContentTranscript));
tenantContent.get('/:id/sections', asyncHandler(sectionController.listSections));
tenantContent.get('/:id/sections/:sectionId', asyncHandler(sectionController.getSection));
tenantContent.get('/:id/podcast', asyncHandler(podcastController.getPodcast));
tenantContent.post('/:id/podcast', enforceQuota('PODCAST'), asyncHandler(podcastController.createPodcast));
tenantContent.get('/:id/video', asyncHandler(videoController.getVideo));
tenantContent.post('/:id/video', enforceQuota('VIDEO'), asyncHandler(videoController.createVideo));
tenantContent.get(
  '/:id/video/segments/:index/audio',
  asyncHandler(videoController.streamVideoSegmentAudio),
);
tenantContent.get('/:id/flashcards', asyncHandler(flashcardsController.getFlashcards));
tenantContent.post('/:id/flashcards', asyncHandler(flashcardsController.createFlashcards));
tenantContent.get('/:id/slides', asyncHandler(slidesController.getSlides));
tenantContent.post('/:id/slides', asyncHandler(slidesController.createSlides));
// Progress / history / podcast-progress so an owner can read & track their own
// material in the reader (the B2C /content/* paths are owner-blocked).
tenantContent.get('/:id/progress', asyncHandler(progressController.getContentProgress));
tenantContent.patch('/:id/progress', asyncHandler(progressController.patchContentProgress));
tenantContent.get('/:id/learning-history', asyncHandler(progressController.getLearningHistory));
tenantContent.get('/:id/podcast/progress', asyncHandler(progressController.getEpisodeProgress));
tenantContent.patch(
  '/:id/podcast/episodes/:episodeId/progress',
  asyncHandler(progressController.patchEpisodeProgress),
);
tenantContent.get(
  '/:id/podcast/episodes/:episodeId/audio',
  asyncHandler(podcastController.streamEpisodeAudio),
);
tenantContent.post(
  '/:id/podcast/episodes/:episodeId/regenerate',
  enforceQuota('PODCAST'),
  asyncHandler(podcastController.regenerateEpisode),
);

tenantRoutes.use('/content', tenantContent);
