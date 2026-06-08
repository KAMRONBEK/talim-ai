import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { routes } from './routes/index.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { registerProcessContentJob } from './jobs/processContent.job.js';
import { registerGenerateQuizJob } from './jobs/generateQuiz.job.js';
import { registerGeneratePodcastJob } from './jobs/generatePodcast.job.js';
import { registerRenderManimJob } from './jobs/renderManim.job.js';
import { LocalStorageService, storageService } from './services/storage.service.js';

async function bootstrap(): Promise<void> {
  if (storageService instanceof LocalStorageService) {
    await storageService.ensureDir();
  }

  registerProcessContentJob();
  registerGenerateQuizJob();
  registerGeneratePodcastJob();
  registerRenderManimJob();

  const app = express();

  const corsOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(cors({ origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
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
