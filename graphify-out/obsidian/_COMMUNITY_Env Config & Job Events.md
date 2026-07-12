---
type: community
cohesion: 0.06
members: 58
---

# Env Config & Job Events

**Cohesion:** 0.06 - loosely connected
**Members:** 58 nodes

## Members
- [[CONTENT_QUEUES]] - code - apps/api/src/services/queue.service.ts
- [[ContentScopedJobData]] - code - apps/api/src/services/queue.service.ts
- [[ContextChunk]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[Env]] - code - apps/api/src/config/env.ts
- [[GenerateFlashcardsJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateQuizJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateVideoJobData]] - code - apps/api/src/services/queue.service.ts
- [[GeneratedCard]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[ImpersonationClaims]] - code - apps/api/src/lib/impersonation.ts
- [[JobEventBus]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[LANGUAGE_NAME]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[PROMPTS]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[ProcessContentJobData]] - code - apps/api/src/services/queue.service.ts
- [[RenderManimJobData]] - code - apps/api/src/services/queue.service.ts
- [[SampledChunk]] - code - apps/api/src/lib/chunk-sampling.ts
- [[StoredSegment_1]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[bootstrap()]] - code - apps/api/src/index.ts
- [[buildFailedBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[buildNarrations()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[buildReadyBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[chunk-sampling.ts]] - code - apps/api/src/lib/chunk-sampling.ts
- [[containmentNormalize()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[contentQueue]] - code - apps/api/src/services/queue.service.ts
- [[env.ts]] - code - apps/api/src/config/env.ts
- [[envSchema]] - code - apps/api/src/config/env.ts
- [[errorMiddleware()]] - code - apps/api/src/middleware/error.middleware.ts
- [[estimateDurationSec()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[execFileAsync]] - code - apps/api/src/jobs/renderManim.job.ts
- [[flashcardQueue]] - code - apps/api/src/services/queue.service.ts
- [[generateFlashcards.job.ts]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[generateQuiz.job.ts]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[generateVideo.job.ts]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[getSectionChunks()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[impersonation.ts]] - code - apps/api/src/lib/impersonation.ts
- [[index.ts]] - code - apps/api/src/index.ts
- [[jobEvents]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[jobEvents.service.ts]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[loadEnv()]] - code - apps/api/src/config/env.ts
- [[manimQueue]] - code - apps/api/src/services/queue.service.ts
- [[processContent.job.ts]] - code - apps/api/src/jobs/processContent.job.ts
- [[queue.service.ts]] - code - apps/api/src/services/queue.service.ts
- [[quizQueue]] - code - apps/api/src/services/queue.service.ts
- [[registerGenerateFlashcardsJob()]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[registerGeneratePodcastJob()]] - code - apps/api/src/jobs/generatePodcast.job.ts
- [[registerGenerateQuizJob()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[registerGenerateVideoJob()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[registerProcessContentJob()]] - code - apps/api/src/jobs/processContent.job.ts
- [[registerRenderManimJob()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[renderFallbackSvg()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[renderManim.job.ts]] - code - apps/api/src/jobs/renderManim.job.ts
- [[renderWithManimCli()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[replaceManimBlockInText()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[resolveSourceSection()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[sampleChunksEvenly()]] - code - apps/api/src/lib/chunk-sampling.ts
- [[slideToText()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[storage.service.ts]] - code - apps/api/src/services/storage.service.ts
- [[videoQueue]] - code - apps/api/src/services/queue.service.ts
- [[wholeMaterialTarget()]] - code - apps/api/src/jobs/generateQuiz.job.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Env_Config__Job_Events
SORT file.name ASC
```

## Connections to other communities
- 19 edges to [[_COMMUNITY_Content Upload & Ingest]]
- 16 edges to [[_COMMUNITY_AI Tutor Chat API]]
- 14 edges to [[_COMMUNITY_Admin Tenants & Prisma Core]]
- 12 edges to [[_COMMUNITY_Podcast Generation & TTS]]
- 8 edges to [[_COMMUNITY_Admin & Usage Controllers]]
- 7 edges to [[_COMMUNITY_Content API Controllers]]
- 7 edges to [[_COMMUNITY_Shared Types & Chat Hooks]]
- 7 edges to [[_COMMUNITY_Question Generation Engine]]
- 6 edges to [[_COMMUNITY_Community 64]]
- 6 edges to [[_COMMUNITY_Community 50]]
- 6 edges to [[_COMMUNITY_Slide Deck Prompts]]
- 6 edges to [[_COMMUNITY_Admin Content & Audit]]
- 4 edges to [[_COMMUNITY_Community 68]]
- 4 edges to [[_COMMUNITY_Assessments Service]]
- 4 edges to [[_COMMUNITY_Community 95]]
- 3 edges to [[_COMMUNITY_Community 98]]
- 3 edges to [[_COMMUNITY_Community 29]]
- 2 edges to [[_COMMUNITY_Community 47]]
- 2 edges to [[_COMMUNITY_Community 58]]
- 2 edges to [[_COMMUNITY_Community 117]]
- 2 edges to [[_COMMUNITY_Community 114]]
- 2 edges to [[_COMMUNITY_Billing & Quota]]
- 1 edge to [[_COMMUNITY_Shared UI Primitives]]
- 1 edge to [[_COMMUNITY_Community 107]]
- 1 edge to [[_COMMUNITY_Community 52]]
- 1 edge to [[_COMMUNITY_Community 55]]

## Top bridge nodes
- [[env.ts]] - degree 23, connects to 9 communities
- [[Env]] - degree 21, connects to 9 communities
- [[generateVideo.job.ts]] - degree 27, connects to 8 communities
- [[processContent.job.ts]] - degree 26, connects to 8 communities
- [[generateQuiz.job.ts]] - degree 32, connects to 7 communities