import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { routes } from './routes/index.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { registerProcessContentJob } from './jobs/processContent.job.js';
import { registerReparseContentJob } from './jobs/reparseContent.job.js';
import { registerGenerateQuizJob } from './jobs/generateQuiz.job.js';
import { registerGeneratePodcastJob } from './jobs/generatePodcast.job.js';
import { registerGenerateVideoJob } from './jobs/generateVideo.job.js';
import { registerGenerateFlashcardsJob } from './jobs/generateFlashcards.job.js';
import { registerGenerateSlidesJob } from './jobs/generateSlides.job.js';
import { registerRenderManimJob } from './jobs/renderManim.job.js';
import { registerGenerateBankQuestionsJob } from './jobs/generateBankQuestions.job.js';
import { registerBackfillTranscriptJob } from './jobs/backfillTranscript.job.js';
import { reconcileStuckMediaClaims } from './services/mediaReconciler.service.js';
import { LocalStorageService, storageService } from './services/storage.service.js';

async function bootstrap(): Promise<void> {
  if (storageService instanceof LocalStorageService) {
    await storageService.ensureDir();
  }

  registerProcessContentJob();
  registerReparseContentJob();
  registerGenerateQuizJob();
  registerGeneratePodcastJob();
  registerGenerateVideoJob();
  registerGenerateFlashcardsJob();
  registerGenerateSlidesJob();
  registerRenderManimJob();
  registerGenerateBankQuestionsJob();
  registerBackfillTranscriptJob();

  // Recover any media claim (content PROCESSING, slide/bank GENERATING) whose Bull job
  // was lost across this restart, so no row is left permanently stuck + un-retryable.
  // Best-effort; must not delay the listen.
  void reconcileStuckMediaClaims();

  const app = express();

  // Behind nginx in production — trust the first proxy hop so req.ip (and the
  // rate limiter) use the real client IP from X-Forwarded-For.
  app.set('trust proxy', 1);

  // Security headers. CSP / cross-origin resource policies are disabled because
  // this is a JSON API that also streams assets (audio, pdf, tutor visuals)
  // consumed by the web app on a different origin.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const corsOrigins = new Set(
    env.CORS_ORIGIN.split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  );
  if (env.NODE_ENV !== 'production') {
    corsOrigins.add('http://localhost:3000');
    corsOrigins.add('http://localhost:3001');
  }
  const allowedOrigins = [...corsOrigins];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    }),
  );
  // 20mb headroom for the re-read OCR payload (client-rasterized page images);
  // ordinary JSON requests are far smaller and validated per-route.
  app.use(express.json({ limit: '20mb' }));
  app.use(routes);
  app.use(errorMiddleware);

  app.listen(env.PORT, () => {
    console.log(`API ready on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
