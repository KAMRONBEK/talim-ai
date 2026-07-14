---
type: community
cohesion: 0.05
members: 87
---

# Bull Jobs & Queues

**Cohesion:** 0.05 - loosely connected
**Members:** 87 nodes

## Members
- [[BackfillTranscriptJobData]] - code - apps/api/src/services/queue.service.ts
- [[CONTENT_QUEUES]] - code - apps/api/src/services/queue.service.ts
- [[ContentScopedJobData]] - code - apps/api/src/services/queue.service.ts
- [[DialogueSegmentBytes]] - code - apps/api/src/services/tts.service.ts
- [[DialogueTurn]] - code - apps/api/src/services/tts.service.ts
- [[Env]] - code - apps/api/src/config/env.ts
- [[GenerateBankQuestionsJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateFlashcardsJobData]] - code - apps/api/src/services/queue.service.ts
- [[GeneratePodcastJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateSlidesJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateVideoJobData]] - code - apps/api/src/services/queue.service.ts
- [[GeneratedCard]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[ImpersonationClaims]] - code - apps/api/src/lib/impersonation.ts
- [[LANGUAGE_NAME]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[PLANS]] - code - apps/api/src/prisma/seed.ts
- [[PROMPTS]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[PlanSeed]] - code - apps/api/src/prisma/seed.ts
- [[ProcessContentJobData]] - code - apps/api/src/services/queue.service.ts
- [[RenderManimJobData]] - code - apps/api/src/services/queue.service.ts
- [[ReparseContentJobData]] - code - apps/api/src/services/queue.service.ts
- [[StorageService]] - code - apps/api/src/services/storage.service.ts
- [[StoredSegment_1]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[autoGenerateSectionDecks()]] - code - apps/api/src/services/slides.service.ts
- [[backfillTranscript.job.ts]] - code - apps/api/src/jobs/backfillTranscript.job.ts
- [[bankQuestionsQueue]] - code - apps/api/src/services/queue.service.ts
- [[bootstrap()]] - code - apps/api/src/index.ts
- [[buildFailedBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[buildNarrations()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[buildPodcastSegments()]] - code - apps/api/src/jobs/generatePodcast.job.ts
- [[buildPodcastUserPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[buildReadyBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[create-admin.ts]] - code - apps/api/src/scripts/create-admin.ts
- [[env.ts]] - code - apps/api/src/config/env.ts
- [[envSchema]] - code - apps/api/src/config/env.ts
- [[errorMiddleware()]] - code - apps/api/src/middleware/error.middleware.ts
- [[estimateDurationSec()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[execFileAsync]] - code - apps/api/src/jobs/renderManim.job.ts
- [[figure.service.ts]] - code - apps/api/src/services/figure.service.ts
- [[flashcardQueue]] - code - apps/api/src/services/queue.service.ts
- [[generateAndStoreSlideDeck()]] - code - apps/api/src/services/slides.service.ts
- [[generateBankQuestions.job.ts]] - code - apps/api/src/jobs/generateBankQuestions.job.ts
- [[generateFlashcards.job.ts]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[generatePodcast.job.ts]] - code - apps/api/src/jobs/generatePodcast.job.ts
- [[generateSlides.job.ts]] - code - apps/api/src/jobs/generateSlides.job.ts
- [[generateVideo.job.ts]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[getPodcastSystemPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[impersonation.ts]] - code - apps/api/src/lib/impersonation.ts
- [[index.ts]] - code - apps/api/src/index.ts
- [[jobEventAudience.ts]] - code - apps/api/src/services/events/jobEventAudience.ts
- [[jobEvents]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[loadEnv()]] - code - apps/api/src/config/env.ts
- [[main()]] - code - apps/api/src/prisma/seed.ts
- [[main()_1]] - code - apps/api/src/scripts/create-admin.ts
- [[manimQueue]] - code - apps/api/src/services/queue.service.ts
- [[parseArgs()]] - code - apps/api/src/scripts/create-admin.ts
- [[parsePodcastDialogue()]] - code - apps/api/src/lib/locale-prompts.ts
- [[podcastQueue]] - code - apps/api/src/services/queue.service.ts
- [[prisma_2]] - code - apps/api/src/lib/prisma.ts
- [[prisma.ts]] - code - apps/api/src/lib/prisma.ts
- [[processContent.job.ts]] - code - apps/api/src/jobs/processContent.job.ts
- [[publishBankStatus()]] - code - apps/api/src/jobs/generateBankQuestions.job.ts
- [[publishContentEvent()]] - code - apps/api/src/services/events/jobEventAudience.ts
- [[publishManimStatus()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[queue.service.ts]] - code - apps/api/src/services/queue.service.ts
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
- [[routes]] - code - apps/api/src/routes/index.ts
- [[seed.ts]] - code - apps/api/src/prisma/seed.ts
- [[slideToText()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[slidesQueue]] - code - apps/api/src/services/queue.service.ts
- [[storage.service.ts]] - code - apps/api/src/services/storage.service.ts
- [[transcriptQueue]] - code - apps/api/src/services/queue.service.ts
- [[videoQueue]] - code - apps/api/src/services/queue.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Bull_Jobs__Queues
SORT file.name ASC
```

## Connections to other communities
- 25 edges to [[_COMMUNITY_Content Controllers]]
- 24 edges to [[_COMMUNITY_Content Access & Media API]]
- 23 edges to [[_COMMUNITY_Slide Deck Generation]]
- 20 edges to [[_COMMUNITY_AI Summary & Ingest]]
- 20 edges to [[_COMMUNITY_Admin API Controllers]]
- 19 edges to [[_COMMUNITY_Subscriptions & Quota]]
- 18 edges to [[_COMMUNITY_Auth & Tenant Services]]
- 18 edges to [[_COMMUNITY_Ingest & Usage Services]]
- 11 edges to [[_COMMUNITY_API Routing & Middleware]]
- 10 edges to [[_COMMUNITY_Question Generation Pipeline]]
- 9 edges to [[_COMMUNITY_Embeddings Service]]
- 9 edges to [[_COMMUNITY_TTS Synthesis]]
- 8 edges to [[_COMMUNITY_RAG Retrieval]]
- 8 edges to [[_COMMUNITY_Chat Streaming API]]
- 8 edges to [[_COMMUNITY_Assessment Services]]
- 7 edges to [[_COMMUNITY_Learner Submission & AI Judge]]
- 6 edges to [[_COMMUNITY_Question Bank Builders]]
- 6 edges to [[_COMMUNITY_Shared Types & Locale]]
- 6 edges to [[_COMMUNITY_Tenant Progress & Mastery]]
- 5 edges to [[_COMMUNITY_SSE Job Events Bus]]
- 4 edges to [[_COMMUNITY_Admin Analytics]]
- 4 edges to [[_COMMUNITY_AI Prompt Builders]]
- 3 edges to [[_COMMUNITY_Quiz API]]
- 3 edges to [[_COMMUNITY_Local Storage Service]]
- 2 edges to [[_COMMUNITY_Content Stage & Limits]]
- 2 edges to [[_COMMUNITY_Learning Progress Service]]
- 2 edges to [[_COMMUNITY_Elo-KT Section Mastery]]
- 2 edges to [[_COMMUNITY_Messaging Service]]
- 1 edge to [[_COMMUNITY_Media Players]]
- 1 edge to [[_COMMUNITY_Narrated Video & Deck Player]]
- 1 edge to [[_COMMUNITY_Tutor Visual Tools]]
- 1 edge to [[_COMMUNITY_Tutor Visual Blocks]]

## Top bridge nodes
- [[prisma.ts]] - degree 69, connects to 22 communities
- [[prisma_2]] - degree 69, connects to 22 communities
- [[env.ts]] - degree 23, connects to 9 communities
- [[Env]] - degree 21, connects to 9 communities
- [[queue.service.ts]] - degree 48, connects to 8 communities