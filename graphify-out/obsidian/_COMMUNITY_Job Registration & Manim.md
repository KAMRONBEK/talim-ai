---
type: community
cohesion: 0.16
members: 18
---

# Job Registration & Manim

**Cohesion:** 0.16 - loosely connected
**Members:** 18 nodes

## Members
- [[RenderManimJobData]] - code - apps/api/src/services/queue.service.ts
- [[bootstrap()]] - code - apps/api/src/index.ts
- [[buildFailedBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[buildReadyBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[errorMiddleware()]] - code - apps/api/src/middleware/error.middleware.ts
- [[execFileAsync]] - code - apps/api/src/jobs/renderManim.job.ts
- [[index.ts]] - code - apps/api/src/index.ts
- [[manimQueue]] - code - apps/api/src/services/queue.service.ts
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

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Job_Registration__Manim
SORT file.name ASC
```

## Connections to other communities
- 13 edges to [[_COMMUNITY_Background Jobs & Queues]]
- 4 edges to [[_COMMUNITY_Config, Pricing & Embeddings]]
- 3 edges to [[_COMMUNITY_AI Tutor Chat API]]
- 2 edges to [[_COMMUNITY_Podcast Generation & Prompts]]
- 2 edges to [[_COMMUNITY_Quiz Generation Job]]
- 2 edges to [[_COMMUNITY_Billing, Usage & Limits]]
- 2 edges to [[_COMMUNITY_API Middleware]]
- 2 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 1 edge to [[_COMMUNITY_Community 112]]
- 1 edge to [[_COMMUNITY_Shared Types & Auth Stores]]
- 1 edge to [[_COMMUNITY_Tutor Visual Tools]]
- 1 edge to [[_COMMUNITY_Chat Message Rendering]]

## Top bridge nodes
- [[renderManim.job.ts]] - degree 22, connects to 7 communities
- [[index.ts]] - degree 22, connects to 7 communities
- [[manimQueue]] - degree 3, connects to 2 communities
- [[registerGenerateFlashcardsJob()]] - degree 3, connects to 1 community
- [[registerGeneratePodcastJob()]] - degree 3, connects to 1 community