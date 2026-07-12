---
type: community
cohesion: 0.12
members: 25
---

# Background Jobs & Queues

**Cohesion:** 0.12 - loosely connected
**Members:** 25 nodes

## Members
- [[CONTENT_QUEUES]] - code - apps/api/src/services/queue.service.ts
- [[ContentScopedJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateFlashcardsJobData]] - code - apps/api/src/services/queue.service.ts
- [[GeneratePodcastJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateQuizJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateVideoJobData]] - code - apps/api/src/services/queue.service.ts
- [[GeneratedCard]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[LANGUAGE_NAME]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[PROMPTS]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[ProcessContentJobData]] - code - apps/api/src/services/queue.service.ts
- [[StorageService]] - code - apps/api/src/services/storage.service.ts
- [[StoredSegment_1]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[buildNarrations()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[contentQueue]] - code - apps/api/src/services/queue.service.ts
- [[estimateDurationSec()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[flashcardQueue]] - code - apps/api/src/services/queue.service.ts
- [[generateFlashcards.job.ts]] - code - apps/api/src/jobs/generateFlashcards.job.ts
- [[generateVideo.job.ts]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[jobEvents]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[processContent.job.ts]] - code - apps/api/src/jobs/processContent.job.ts
- [[queue.service.ts]] - code - apps/api/src/services/queue.service.ts
- [[quizQueue]] - code - apps/api/src/services/queue.service.ts
- [[slideToText()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[storage.service.ts]] - code - apps/api/src/services/storage.service.ts
- [[videoQueue]] - code - apps/api/src/services/queue.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Background_Jobs__Queues
SORT file.name ASC
```

## Connections to other communities
- 13 edges to [[_COMMUNITY_Job Registration & Manim]]
- 12 edges to [[_COMMUNITY_Content API Controller]]
- 8 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 8 edges to [[_COMMUNITY_Podcast Generation & Prompts]]
- 7 edges to [[_COMMUNITY_Media & Progress Controllers]]
- 6 edges to [[_COMMUNITY_Config, Pricing & Embeddings]]
- 5 edges to [[_COMMUNITY_Admin Content & Audit]]
- 5 edges to [[_COMMUNITY_AI Tutor Chat API]]
- 5 edges to [[_COMMUNITY_Slide Deck Prompts]]
- 4 edges to [[_COMMUNITY_Providers & Job Events]]
- 4 edges to [[_COMMUNITY_AI Provider Service]]
- 4 edges to [[_COMMUNITY_Quiz Generation Job]]
- 3 edges to [[_COMMUNITY_Billing, Usage & Limits]]
- 2 edges to [[_COMMUNITY_Quiz API Controller]]
- 2 edges to [[_COMMUNITY_Shared Types & Auth Stores]]
- 2 edges to [[_COMMUNITY_Content Grid & Learner Dashboard]]
- 2 edges to [[_COMMUNITY_Community 98]]
- 2 edges to [[_COMMUNITY_PDF & OCR Service]]
- 2 edges to [[_COMMUNITY_YouTube Transcript Service]]
- 2 edges to [[_COMMUNITY_Community 112]]
- 1 edge to [[_COMMUNITY_Slide Deck UI]]
- 1 edge to [[_COMMUNITY_Section Service]]
- 1 edge to [[_COMMUNITY_Assessments Service]]

## Top bridge nodes
- [[processContent.job.ts]] - degree 26, connects to 11 communities
- [[queue.service.ts]] - degree 31, connects to 10 communities
- [[generateVideo.job.ts]] - degree 27, connects to 10 communities
- [[storage.service.ts]] - degree 16, connects to 8 communities
- [[generateFlashcards.job.ts]] - degree 16, connects to 7 communities