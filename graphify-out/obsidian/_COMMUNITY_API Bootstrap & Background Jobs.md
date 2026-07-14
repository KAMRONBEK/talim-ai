---
type: community
cohesion: 0.07
members: 61
---

# API Bootstrap & Background Jobs

**Cohesion:** 0.07 - loosely connected
**Members:** 61 nodes

## Members
- [[BackfillTranscriptJobData]] - code - apps/api/src/services/queue.service.ts
- [[CONTENT_QUEUES]] - code - apps/api/src/services/queue.service.ts
- [[ContentScopedJobData]] - code - apps/api/src/services/queue.service.ts
- [[Env]] - code - apps/api/src/config/env.ts
- [[GenerateBankQuestionsJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateFlashcardsJobData]] - code - apps/api/src/services/queue.service.ts
- [[GeneratedCard]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[ImpersonationClaims]] - code - apps/api/src/lib/impersonation.ts
- [[LIVE_STATES]] - code - apps/api/src/services/mediaReconciler.service.ts
- [[PROMPTS]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[ProcessContentJobData]] - code - apps/api/src/services/queue.service.ts
- [[RenderManimJobData]] - code - apps/api/src/services/queue.service.ts
- [[ReparseContentJobData]] - code - apps/api/src/services/queue.service.ts
- [[StorageService]] - code - apps/api/src/services/storage.service.ts
- [[backfillTranscript.job.ts]] - code - apps/api/src/jobs/backfillTranscript.job.ts
- [[bankQuestionsQueue]] - code - apps/api/src/services/queue.service.ts
- [[bootstrap()]] - code - apps/api/src/index.ts
- [[buildFailedBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[buildReadyBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[collectLiveJobData()]] - code - apps/api/src/services/mediaReconciler.service.ts
- [[contentQueue]] - code - apps/api/src/services/queue.service.ts
- [[env.ts]] - code - apps/api/src/config/env.ts
- [[envSchema]] - code - apps/api/src/config/env.ts
- [[errorMiddleware()]] - code - apps/api/src/middleware/error.middleware.ts
- [[execFileAsync]] - code - apps/api/src/jobs/renderManim.job.ts
- [[flashcardQueue]] - code - apps/api/src/services/queue.service.ts
- [[generateBankQuestions.job.ts]] - code - apps/api/src/jobs/generateBankQuestions.job.ts
- [[generateFlashcards.job.ts]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[impersonation.ts]] - code - apps/api/src/lib/impersonation.ts
- [[index.ts]] - code - apps/api/src/index.ts
- [[jobEvents]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[loadEnv()]] - code - apps/api/src/config/env.ts
- [[manimQueue]] - code - apps/api/src/services/queue.service.ts
- [[mediaReconciler.service.ts]] - code - apps/api/src/services/mediaReconciler.service.ts
- [[podcastQueue]] - code - apps/api/src/services/queue.service.ts
- [[processContent.job.ts]] - code - apps/api/src/jobs/processContent.job.ts
- [[publishBankStatus()]] - code - apps/api/src/jobs/generateBankQuestions.job.ts
- [[publishManimStatus()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[queue.service.ts]] - code - apps/api/src/services/queue.service.ts
- [[reconcileRowStatus()]] - code - apps/api/src/services/mediaReconciler.service.ts
- [[reconcileStuckMediaClaims()]] - code - apps/api/src/services/mediaReconciler.service.ts
- [[registerBackfillTranscriptJob()]] - code - apps/api/src/jobs/backfillTranscript.job.ts
- [[registerGenerateBankQuestionsJob()]] - code - apps/api/src/jobs/generateBankQuestions.job.ts
- [[registerGenerateFlashcardsJob()]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[registerGeneratePodcastJob()]] - code - apps/api/src/jobs/generatePodcast.job.ts
- [[registerGenerateQuizJob()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[registerGenerateSlidesJob()]] - code - apps/api/src/jobs/generateSlides.job.ts
- [[registerGenerateVideoJob()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[registerProcessContentJob()]] - code - apps/api/src/jobs/processContent.job.ts
- [[registerRenderManimJob()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[registerReparseContentJob()]] - code - apps/api/src/jobs/reparseContent.job.ts
- [[renderFallbackSvg()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[renderManim.job.ts]] - code - apps/api/src/jobs/renderManim.job.ts
- [[renderWithManimCli()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[reparseContent.job.ts]] - code - apps/api/src/jobs/reparseContent.job.ts
- [[reparseQueue]] - code - apps/api/src/services/queue.service.ts
- [[replaceManimBlockInText()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[slidesQueue]] - code - apps/api/src/services/queue.service.ts
- [[storage.service.ts]] - code - apps/api/src/services/storage.service.ts
- [[transcriptQueue]] - code - apps/api/src/services/queue.service.ts
- [[videoQueue]] - code - apps/api/src/services/queue.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/API_Bootstrap__Background_Jobs
SORT file.name ASC
```

## Connections to other communities
- 31 edges to [[_COMMUNITY_Job Event Fan-out & Media Jobs]]
- 15 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 14 edges to [[_COMMUNITY_AI Tutor Chat Controller]]
- 14 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 11 edges to [[_COMMUNITY_Content Media Controllers]]
- 9 edges to [[_COMMUNITY_Podcast Generation & TTS]]
- 6 edges to [[_COMMUNITY_API Routes & Middleware]]
- 6 edges to [[_COMMUNITY_Usage Pricing & Metering]]
- 6 edges to [[_COMMUNITY_PDF Extraction Service]]
- 6 edges to [[_COMMUNITY_YouTube Ingest Service]]
- 6 edges to [[_COMMUNITY_Admin Content & Audit Controllers]]
- 5 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 5 edges to [[_COMMUNITY_Quiz Generation Pipeline]]
- 5 edges to [[_COMMUNITY_Question Bank Service]]
- 4 edges to [[_COMMUNITY_AI Provider Service]]
- 3 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 3 edges to [[_COMMUNITY_Local Storage Service]]
- 3 edges to [[_COMMUNITY_In-Process Job Event Bus]]
- 2 edges to [[_COMMUNITY_Auth Controller]]
- 2 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 1 edge to [[_COMMUNITY_Flashcards UI]]
- 1 edge to [[_COMMUNITY_Learner Controller]]
- 1 edge to [[_COMMUNITY_Section Controller]]
- 1 edge to [[_COMMUNITY_Subscription & Billing Service]]
- 1 edge to [[_COMMUNITY_AI Tutor Visual Tools]]
- 1 edge to [[_COMMUNITY_Tutor Chat Visual Components]]
- 1 edge to [[_COMMUNITY_Assessment Service]]

## Top bridge nodes
- [[env.ts]] - degree 23, connects to 10 communities
- [[Env]] - degree 21, connects to 10 communities
- [[queue.service.ts]] - degree 49, connects to 9 communities
- [[processContent.job.ts]] - degree 26, connects to 8 communities
- [[storage.service.ts]] - degree 18, connects to 7 communities