---
type: community
cohesion: 0.06
members: 53
---

# src jobs

**Cohesion:** 0.06 - loosely connected
**Members:** 53 nodes

## Members
- [[.constructor()_3]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[.replay()]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[.subscribe()]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[CONTENT_QUEUES]] - code - apps/api/src/services/queue.service.ts
- [[ContentScopedJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateFlashcardsJobData]] - code - apps/api/src/services/queue.service.ts
- [[GeneratePodcastJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateQuizJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateVideoJobData]] - code - apps/api/src/services/queue.service.ts
- [[GeneratedCard]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[InProcessJobEventBus]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[JobEventBus]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[LANGUAGE_NAME]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[PROMPTS]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[ProcessContentJobData]] - code - apps/api/src/services/queue.service.ts
- [[RenderManimJobData]] - code - apps/api/src/services/queue.service.ts
- [[SeqJobEvent]] - code - packages/types/jobEvents.ts
- [[StoredSegment_1]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[UserState]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[bootstrap()]] - code - apps/api/src/index.ts
- [[buildFailedBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[buildNarrations()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[buildPodcastUserPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[buildReadyBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[errorMiddleware()]] - code - apps/api/src/middleware/error.middleware.ts
- [[estimateDurationSec()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[execFileAsync]] - code - apps/api/src/jobs/renderManim.job.ts
- [[flashcardQueue]] - code - apps/api/src/services/queue.service.ts
- [[generateFlashcards.job.ts]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[generatePodcast.job.ts]] - code - apps/api/src/jobs/generatePodcast.job.ts
- [[generateVideo.job.ts]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[getPodcastSystemPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[index.ts]] - code - apps/api/src/index.ts
- [[jobEvents]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[jobEvents.service.ts]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[manimQueue]] - code - apps/api/src/services/queue.service.ts
- [[parsePodcastDialogue()]] - code - apps/api/src/lib/locale-prompts.ts
- [[podcastQueue]] - code - apps/api/src/services/queue.service.ts
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
- [[routes]] - code - apps/api/src/routes/index.ts
- [[slideToText()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[videoQueue]] - code - apps/api/src/services/queue.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/src_jobs
SORT file.name ASC
```

## Connections to other communities
- 20 edges to [[_COMMUNITY_src services · env.ts]]
- 8 edges to [[_COMMUNITY_controllers admin]]
- 8 edges to [[_COMMUNITY_subscription]]
- 7 edges to [[_COMMUNITY_src lib · GeneratedQuestion]]
- 6 edges to [[_COMMUNITY_src controllers]]
- 6 edges to [[_COMMUNITY_src services · TutorGraphIntent]]
- 6 edges to [[_COMMUNITY_packages types]]
- 5 edges to [[_COMMUNITY_packages types · api.ts]]
- 5 edges to [[_COMMUNITY_src services · tts-normalize.ts]]
- 4 edges to [[_COMMUNITY_src controllers · chat.controller.ts]]
- 4 edges to [[_COMMUNITY_src lib · locale-prompts.ts]]
- 3 edges to [[_COMMUNITY_src services · slides.controller.ts]]
- 3 edges to [[_COMMUNITY_web lib · providers.tsx]]
- 2 edges to [[_COMMUNITY_src controllers · quiz.controller.ts]]
- 2 edges to [[_COMMUNITY_src routes]]
- 2 edges to [[_COMMUNITY_src controllers · summary.controller.ts]]
- 1 edge to [[_COMMUNITY_src controllers · content.controller.ts]]
- 1 edge to [[_COMMUNITY_src controllers · sendContentFile()]]
- 1 edge to [[_COMMUNITY_src services · LocalStorageService]]
- 1 edge to [[_COMMUNITY_src services]]
- 1 edge to [[_COMMUNITY_components deck · DeckPlayer.tsx]]
- 1 edge to [[_COMMUNITY_src lib]]
- 1 edge to [[_COMMUNITY_components chat]]

## Top bridge nodes
- [[generatePodcast.job.ts]] - degree 25, connects to 9 communities
- [[queue.service.ts]] - degree 31, connects to 8 communities
- [[generateVideo.job.ts]] - degree 27, connects to 8 communities
- [[renderManim.job.ts]] - degree 22, connects to 6 communities
- [[index.ts]] - degree 22, connects to 5 communities