---
type: community
cohesion: 0.04
members: 120
---

# Env Config & Background Jobs

**Cohesion:** 0.04 - loosely connected
**Members:** 120 nodes

## Members
- [[ACCENTS]] - code - apps/api/src/lib/deck-prompt.ts
- [[AuthPayload]] - code - apps/api/src/middleware/auth.middleware.ts
- [[CONTENT_QUEUES]] - code - apps/api/src/services/queue.service.ts
- [[ContentScopedJobData]] - code - apps/api/src/services/queue.service.ts
- [[Deck]] - code - packages/types/deck.ts
- [[DeckAudience]] - code - packages/types/deck.ts
- [[DialogueSegmentBytes]] - code - apps/api/src/services/tts.service.ts
- [[DialogueTurn]] - code - apps/api/src/services/tts.service.ts
- [[Env]] - code - apps/api/src/config/env.ts
- [[FlashcardGrade]] - code - apps/api/src/services/srs.service.ts
- [[FlashcardReviewResult]] - code - apps/api/src/services/srs.service.ts
- [[GRADE_QUALITY]] - code - apps/api/src/services/srs.service.ts
- [[GenerateBankQuestionsJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateFlashcardsJobData]] - code - apps/api/src/services/queue.service.ts
- [[GeneratePodcastJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateSlidesJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateVideoJobData]] - code - apps/api/src/services/queue.service.ts
- [[GeneratedCard]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[ImpersonationClaims]] - code - apps/api/src/lib/impersonation.ts
- [[LANGUAGE_NAME]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[LIVE_STATES]] - code - apps/api/src/services/mediaReconciler.service.ts
- [[Overrides]] - code - apps/api/src/services/slides.service.ts
- [[PLANS]] - code - apps/api/src/prisma/seed.ts
- [[PROMPTS]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[PlanSeed]] - code - apps/api/src/prisma/seed.ts
- [[ProcessContentJobData]] - code - apps/api/src/services/queue.service.ts
- [[RenderManimJobData]] - code - apps/api/src/services/queue.service.ts
- [[ReparseContentJobData]] - code - apps/api/src/services/queue.service.ts
- [[SlideDeckRow]] - code - apps/api/src/services/slides.service.ts
- [[StorageService]] - code - apps/api/src/services/storage.service.ts
- [[StoredSegment_1]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[audienceTone()]] - code - apps/api/src/lib/deck-prompt.ts
- [[auth.middleware.ts]] - code - apps/api/src/middleware/auth.middleware.ts
- [[autoGenerateSectionDecks()]] - code - apps/api/src/services/slides.service.ts
- [[backfillTranscript.job.ts]] - code - apps/api/src/jobs/backfillTranscript.job.ts
- [[bankQuestionsQueue]] - code - apps/api/src/services/queue.service.ts
- [[bootstrap()]] - code - apps/api/src/index.ts
- [[buildDeckUserPrompt()]] - code - apps/api/src/lib/deck-prompt.ts
- [[buildFailedBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[buildNarrations()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[buildPodcastSegments()]] - code - apps/api/src/jobs/generatePodcast.job.ts
- [[buildPodcastUserPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[buildReadyBlock()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[captionAndStoreFigures()]] - code - apps/api/src/services/figure.service.ts
- [[coerceDeck()]] - code - apps/api/src/services/slides.service.ts
- [[collectLiveJobData()]] - code - apps/api/src/services/mediaReconciler.service.ts
- [[contentQueue]] - code - apps/api/src/services/queue.service.ts
- [[create-admin.ts]] - code - apps/api/src/scripts/create-admin.ts
- [[deck-prompt.ts]] - code - apps/api/src/lib/deck-prompt.ts
- [[deriveTitle()]] - code - apps/api/src/services/slides.service.ts
- [[env.ts]] - code - apps/api/src/config/env.ts
- [[envSchema]] - code - apps/api/src/config/env.ts
- [[errorMiddleware()]] - code - apps/api/src/middleware/error.middleware.ts
- [[estimateDurationSec()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[estimatedMinutesFor()]] - code - apps/api/src/lib/deck-prompt.ts
- [[execFileAsync]] - code - apps/api/src/jobs/renderManim.job.ts
- [[figure.service.ts]] - code - apps/api/src/services/figure.service.ts
- [[flashcardQueue]] - code - apps/api/src/services/queue.service.ts
- [[generateAndStoreSlideDeck()]] - code - apps/api/src/services/slides.service.ts
- [[generateBankQuestions.job.ts]] - code - apps/api/src/jobs/generateBankQuestions.job.ts
- [[generateFlashcards.job.ts]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[generatePodcast.job.ts]] - code - apps/api/src/jobs/generatePodcast.job.ts
- [[generateSlideDeck()]] - code - apps/api/src/services/slides.service.ts
- [[generateSlides.job.ts]] - code - apps/api/src/jobs/generateSlides.job.ts
- [[generateVideo.job.ts]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[getDeckSystemPrompt()]] - code - apps/api/src/lib/deck-prompt.ts
- [[getPodcastSystemPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[impersonation.ts]] - code - apps/api/src/lib/impersonation.ts
- [[index.ts]] - code - apps/api/src/index.ts
- [[isRecord()]] - code - apps/api/src/services/slides.service.ts
- [[jobEventAudience.ts]] - code - apps/api/src/services/events/jobEventAudience.ts
- [[languageGuidance()]] - code - apps/api/src/lib/deck-prompt.ts
- [[loadEnv()]] - code - apps/api/src/config/env.ts
- [[main()]] - code - apps/api/src/prisma/seed.ts
- [[main()_1]] - code - apps/api/src/scripts/create-admin.ts
- [[manimQueue]] - code - apps/api/src/services/queue.service.ts
- [[mediaReconciler.service.ts]] - code - apps/api/src/services/mediaReconciler.service.ts
- [[normalizeSlide()]] - code - apps/api/src/services/slides.service.ts
- [[parseArgs()]] - code - apps/api/src/scripts/create-admin.ts
- [[parsePodcastDialogue()]] - code - apps/api/src/lib/locale-prompts.ts
- [[pickAccent()]] - code - apps/api/src/lib/deck-prompt.ts
- [[podcastQueue]] - code - apps/api/src/services/queue.service.ts
- [[prisma_2]] - code - apps/api/src/lib/prisma.ts
- [[prisma.ts]] - code - apps/api/src/lib/prisma.ts
- [[processContent.job.ts]] - code - apps/api/src/jobs/processContent.job.ts
- [[publishBankStatus()]] - code - apps/api/src/jobs/generateBankQuestions.job.ts
- [[publishContentEvent()]] - code - apps/api/src/services/events/jobEventAudience.ts
- [[publishContentEventTo()]] - code - apps/api/src/services/events/jobEventAudience.ts
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
- [[resolveContentAudience()]] - code - apps/api/src/services/events/jobEventAudience.ts
- [[seed.ts]] - code - apps/api/src/prisma/seed.ts
- [[slideToText()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[slides.service.ts]] - code - apps/api/src/services/slides.service.ts
- [[slidesQueue]] - code - apps/api/src/services/queue.service.ts
- [[srs.service.ts]] - code - apps/api/src/services/srs.service.ts
- [[storage]] - code - apps/api/src/middleware/upload.middleware.ts
- [[storage.service.ts]] - code - apps/api/src/services/storage.service.ts
- [[targetSlideCount()]] - code - apps/api/src/lib/deck-prompt.ts
- [[toBulletObjects()]] - code - apps/api/src/services/slides.service.ts
- [[upload.middleware.ts]] - code - apps/api/src/middleware/upload.middleware.ts
- [[videoQueue]] - code - apps/api/src/services/queue.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Env_Config__Background_Jobs
SORT file.name ASC
```

## Connections to other communities
- 47 edges to [[_COMMUNITY_Flashcards & Podcast Controllers]]
- 39 edges to [[_COMMUNITY_Embedding & Chunk Inspection]]
- 32 edges to [[_COMMUNITY_Content Controller (YouTubeOCR)]]
- 28 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 25 edges to [[_COMMUNITY_Assessment Controller]]
- 24 edges to [[_COMMUNITY_Audit & Content Management]]
- 11 edges to [[_COMMUNITY_Summary Controller]]
- 10 edges to [[_COMMUNITY_AI Service (DeepSeek)]]
- 10 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 10 edges to [[_COMMUNITY_Assessment Service]]
- 9 edges to [[_COMMUNITY_TTS Text Normalization]]
- 9 edges to [[_COMMUNITY_Chat Controller (SSE)]]
- 9 edges to [[_COMMUNITY_Quiz Generation Job]]
- 8 edges to [[_COMMUNITY_Auth Controller]]
- 8 edges to [[_COMMUNITY_Quiz Controller]]
- 8 edges to [[_COMMUNITY_Job Event Bus]]
- 8 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 7 edges to [[_COMMUNITY_Bank & Question Management]]
- 6 edges to [[_COMMUNITY_YouTube Transcription Service]]
- 6 edges to [[_COMMUNITY_Tenant Service & Assignments]]
- 5 edges to [[_COMMUNITY_Flashcards Page]]
- 5 edges to [[_COMMUNITY_Slide UI Components]]
- 4 edges to [[_COMMUNITY_Locale Prompts (TutorPodcastSummary)]]
- 4 edges to [[_COMMUNITY_Deck Slide Schema]]
- 3 edges to [[_COMMUNITY_Analytics Controller]]
- 3 edges to [[_COMMUNITY_Local Storage Service]]
- 2 edges to [[_COMMUNITY_Analytics & Usage Pricing]]
- 2 edges to [[_COMMUNITY_Admin Role Management]]
- 2 edges to [[_COMMUNITY_Section Mastery Service]]
- 2 edges to [[_COMMUNITY_Tenant Messaging Service]]
- 2 edges to [[_COMMUNITY_Student Import Service]]
- 1 edge to [[_COMMUNITY_Learner API Controller]]
- 1 edge to [[_COMMUNITY_Tenant Student Management]]
- 1 edge to [[_COMMUNITY_Transcript Panel & Video Viewer]]
- 1 edge to [[_COMMUNITY_Tutor Tools (ChartGeogebraSandbox)]]
- 1 edge to [[_COMMUNITY_Chat Store & Tutor Graph]]
- 1 edge to [[_COMMUNITY_Deck Player & Section Reader]]
- 1 edge to [[_COMMUNITY_Narrated Video Player]]

## Top bridge nodes
- [[prisma.ts]] - degree 70, connects to 21 communities
- [[prisma_2]] - degree 70, connects to 21 communities
- [[auth.middleware.ts]] - degree 50, connects to 13 communities
- [[slides.service.ts]] - degree 61, connects to 9 communities
- [[generatePodcast.job.ts]] - degree 29, connects to 8 communities