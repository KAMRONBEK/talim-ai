---
type: community
cohesion: 0.09
members: 43
---

# Env Config & Jobs

**Cohesion:** 0.09 - loosely connected
**Members:** 43 nodes

## Members
- [[CONTENT_QUEUES]] - code - apps/api/src/services/queue.service.ts
- [[ContentScopedJobData]] - code - apps/api/src/services/queue.service.ts
- [[Env]] - code - apps/api/src/config/env.ts
- [[GeneratePodcastJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateVideoJobData]] - code - apps/api/src/services/queue.service.ts
- [[LANGUAGE_NAME]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[ProcessContentJobData]] - code - apps/api/src/services/queue.service.ts
- [[RenderManimJobData]] - code - apps/api/src/services/queue.service.ts
- [[StorageService]] - code - apps/api/src/services/storage.service.ts
- [[StoredSegment_1]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[bootstrap()]] - code - apps/api/src/index.ts
- [[buildFailedBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[buildNarrations()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[buildPodcastUserPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[buildReadyBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[contentQueue]] - code - apps/api/src/services/queue.service.ts
- [[env.ts]] - code - apps/api/src/config/env.ts
- [[envSchema]] - code - apps/api/src/config/env.ts
- [[errorMiddleware()]] - code - apps/api/src/middleware/error.middleware.ts
- [[estimateDurationSec()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[execFileAsync]] - code - apps/api/src/jobs/renderManim.job.ts
- [[generatePodcast.job.ts]] - code - apps/api/src/jobs/generatePodcast.job.ts
- [[generateVideo.job.ts]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[getPodcastSystemPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[index.ts]] - code - apps/api/src/index.ts
- [[loadEnv()]] - code - apps/api/src/config/env.ts
- [[manimQueue]] - code - apps/api/src/services/queue.service.ts
- [[parsePodcastDialogue()]] - code - apps/api/src/lib/locale-prompts.ts
- [[podcastQueue]] - code - apps/api/src/services/queue.service.ts
- [[processContent.job.ts]] - code - apps/api/src/jobs/processContent.job.ts
- [[queue.service.ts]] - code - apps/api/src/services/queue.service.ts
- [[registerGeneratePodcastJob()]] - code - apps/api/src/jobs/generatePodcast.job.ts
- [[registerGenerateQuizJob()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[registerGenerateVideoJob()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[registerProcessContentJob()]] - code - apps/api/src/jobs/processContent.job.ts
- [[registerRenderManimJob()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[renderFallbackSvg()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[renderManim.job.ts]] - code - apps/api/src/jobs/renderManim.job.ts
- [[renderWithManimCli()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[replaceManimBlockInText()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[slideToText()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[storage.service.ts]] - code - apps/api/src/services/storage.service.ts
- [[videoQueue]] - code - apps/api/src/services/queue.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Env_Config__Jobs
SORT file.name ASC
```

## Connections to other communities
- 17 edges to [[_COMMUNITY_Content Controller]]
- 12 edges to [[_COMMUNITY_Usage Pricing & Chunk Tools]]
- 10 edges to [[_COMMUNITY_Content & Podcast API]]
- 8 edges to [[_COMMUNITY_Admin Audit & Auth]]
- 8 edges to [[_COMMUNITY_Tenant Admin & Prisma]]
- 7 edges to [[_COMMUNITY_Community 33]]
- 6 edges to [[_COMMUNITY_Community 48]]
- 5 edges to [[_COMMUNITY_Community 57]]
- 5 edges to [[_COMMUNITY_Admin Analytics & Subscriptions]]
- 5 edges to [[_COMMUNITY_Community 67]]
- 4 edges to [[_COMMUNITY_Community 65]]
- 4 edges to [[_COMMUNITY_Deck Prompt Builder]]
- 4 edges to [[_COMMUNITY_Community 55]]
- 4 edges to [[_COMMUNITY_Billing & Usage API]]
- 4 edges to [[_COMMUNITY_Community 39]]
- 3 edges to [[_COMMUNITY_Community 96]]
- 3 edges to [[_COMMUNITY_Section & Summary API]]
- 3 edges to [[_COMMUNITY_Slide Deck Types]]
- 3 edges to [[_COMMUNITY_Community 35]]
- 1 edge to [[_COMMUNITY_Quiz Controller]]
- 1 edge to [[_COMMUNITY_Shared UI Components]]
- 1 edge to [[_COMMUNITY_Tutor Visual Tools]]
- 1 edge to [[_COMMUNITY_Community 45]]

## Top bridge nodes
- [[generateVideo.job.ts]] - degree 25, connects to 8 communities
- [[processContent.job.ts]] - degree 24, connects to 8 communities
- [[generatePodcast.job.ts]] - degree 23, connects to 8 communities
- [[env.ts]] - degree 22, connects to 8 communities
- [[Env]] - degree 20, connects to 8 communities