---
type: community
cohesion: 0.10
members: 38
---

# Env Config & Background Job Registration

**Cohesion:** 0.10 - loosely connected
**Members:** 38 nodes

## Members
- [[CONTENT_QUEUES]] - code - apps/api/src/services/queue.service.ts
- [[ContentScopedJobData]] - code - apps/api/src/services/queue.service.ts
- [[Env]] - code - apps/api/src/config/env.ts
- [[GeneratePodcastJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateQuizJobData]] - code - apps/api/src/services/queue.service.ts
- [[ProcessContentJobData]] - code - apps/api/src/services/queue.service.ts
- [[RenderManimJobData]] - code - apps/api/src/services/queue.service.ts
- [[StorageService]] - code - apps/api/src/services/storage.service.ts
- [[bootstrap()]] - code - apps/api/src/index.ts
- [[buildFailedBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[buildPodcastUserPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[buildReadyBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[contentQueue]] - code - apps/api/src/services/queue.service.ts
- [[env.ts]] - code - apps/api/src/config/env.ts
- [[envSchema]] - code - apps/api/src/config/env.ts
- [[errorMiddleware()]] - code - apps/api/src/middleware/error.middleware.ts
- [[execFileAsync]] - code - apps/api/src/jobs/renderManim.job.ts
- [[generatePodcast.job.ts]] - code - apps/api/src/jobs/generatePodcast.job.ts
- [[getPodcastSystemPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[index.ts]] - code - apps/api/src/index.ts
- [[loadEnv()]] - code - apps/api/src/config/env.ts
- [[manimQueue]] - code - apps/api/src/services/queue.service.ts
- [[podcastQueue]] - code - apps/api/src/services/queue.service.ts
- [[processContent.job.ts]] - code - apps/api/src/jobs/processContent.job.ts
- [[queue.service.ts]] - code - apps/api/src/services/queue.service.ts
- [[quizQueue]] - code - apps/api/src/services/queue.service.ts
- [[registerGeneratePodcastJob()]] - code - apps/api/src/jobs/generatePodcast.job.ts
- [[registerGenerateQuizJob()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[registerProcessContentJob()]] - code - apps/api/src/jobs/processContent.job.ts
- [[registerRenderManimJob()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[renderFallbackSvg()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[renderManim.job.ts]] - code - apps/api/src/jobs/renderManim.job.ts
- [[renderWithManimCli()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[replaceManimBlockInText()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[routes]] - code - apps/api/src/routes/index.ts
- [[storage]] - code - apps/api/src/middleware/upload.middleware.ts
- [[storage.service.ts]] - code - apps/api/src/services/storage.service.ts
- [[upload.middleware.ts]] - code - apps/api/src/middleware/upload.middleware.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Env_Config__Background_Job_Registration
SORT file.name ASC
```

## Connections to other communities
- 16 edges to [[_COMMUNITY_AI Summary Generation]]
- 7 edges to [[_COMMUNITY_Tenant Content Controller]]
- 7 edges to [[_COMMUNITY_API Middleware (authquotarate-limit)]]
- 6 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 6 edges to [[_COMMUNITY_Chat Controller & Sessions]]
- 5 edges to [[_COMMUNITY_Admin Audit & Content Controller]]
- 5 edges to [[_COMMUNITY_Podcast & Progress Controllers]]
- 5 edges to [[_COMMUNITY_Quiz Generation Job]]
- 4 edges to [[_COMMUNITY_AI Service (DeepSeektools)]]
- 4 edges to [[_COMMUNITY_Embedding Inspection Script]]
- 4 edges to [[_COMMUNITY_Usage Pricing & PDF Extraction]]
- 4 edges to [[_COMMUNITY_AI Slide-Deck Prompting]]
- 4 edges to [[_COMMUNITY_TTS Normalization Service]]
- 3 edges to [[_COMMUNITY_YouTube Transcription Service]]
- 3 edges to [[_COMMUNITY_Local File Storage Service]]
- 3 edges to [[_COMMUNITY_Locale-Aware AI Prompts]]
- 2 edges to [[_COMMUNITY_Auth Controller (loginjoinpassword)]]
- 2 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 2 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 2 edges to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 1 edge to [[_COMMUNITY_Web API Client & Locale]]
- 1 edge to [[_COMMUNITY_Subscription Service]]
- 1 edge to [[_COMMUNITY_AI Tutor Visual Tools]]
- 1 edge to [[_COMMUNITY_Chat Store & Tutor Graph Payloads]]

## Top bridge nodes
- [[env.ts]] - degree 21, connects to 11 communities
- [[Env]] - degree 19, connects to 11 communities
- [[processContent.job.ts]] - degree 24, connects to 7 communities
- [[queue.service.ts]] - degree 23, connects to 7 communities
- [[generatePodcast.job.ts]] - degree 21, connects to 6 communities