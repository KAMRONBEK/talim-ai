---
type: community
cohesion: 0.11
members: 42
---

# Job Event Fan-out & Media Jobs

**Cohesion:** 0.11 - loosely connected
**Members:** 42 nodes

## Members
- [[ACCENTS]] - code - apps/api/src/lib/deck-prompt.ts
- [[ContentSlideDeck]] - code - packages/types/deck.ts
- [[DeckAudience]] - code - packages/types/deck.ts
- [[GenerateSlidesJobData]] - code - apps/api/src/services/queue.service.ts
- [[GenerateVideoJobData]] - code - apps/api/src/services/queue.service.ts
- [[LANGUAGE_NAME]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[Overrides]] - code - apps/api/src/services/slides.service.ts
- [[SlideDeckRow]] - code - apps/api/src/services/slides.service.ts
- [[StoredSegment_1]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[audienceTone()]] - code - apps/api/src/lib/deck-prompt.ts
- [[autoGenerateSectionDecks()]] - code - apps/api/src/services/slides.service.ts
- [[boundContextByTokens()]] - code - apps/api/src/services/rag.service.ts
- [[buildContext()]] - code - apps/api/src/services/slides.service.ts
- [[buildDeckUserPrompt()]] - code - apps/api/src/lib/deck-prompt.ts
- [[buildNarrations()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[coerceDeck()]] - code - apps/api/src/services/slides.service.ts
- [[deck-prompt.ts]] - code - apps/api/src/lib/deck-prompt.ts
- [[deckScopeKey()]] - code - apps/api/src/services/slides.service.ts
- [[deriveTitle()]] - code - apps/api/src/services/slides.service.ts
- [[enqueueSlideDeckGeneration()]] - code - apps/api/src/services/slides.service.ts
- [[estimateDurationSec()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[estimatedMinutesFor()]] - code - apps/api/src/lib/deck-prompt.ts
- [[formatSlideDeck()]] - code - apps/api/src/services/slides.service.ts
- [[generateAndStoreSlideDeck()]] - code - apps/api/src/services/slides.service.ts
- [[generateSlideDeck()]] - code - apps/api/src/services/slides.service.ts
- [[generateSlides.job.ts]] - code - apps/api/src/jobs/generateSlides.job.ts
- [[generateVideo.job.ts]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[getDeckSystemPrompt()]] - code - apps/api/src/lib/deck-prompt.ts
- [[getReadySlideDeckAnyLocale()]] - code - apps/api/src/services/slides.service.ts
- [[getSlideDeck()]] - code - apps/api/src/services/slides.service.ts
- [[isRecord()]] - code - apps/api/src/services/slides.service.ts
- [[jobEventAudience.ts]] - code - apps/api/src/services/events/jobEventAudience.ts
- [[languageGuidance()]] - code - apps/api/src/lib/deck-prompt.ts
- [[normalizeSlide()]] - code - apps/api/src/services/slides.service.ts
- [[pickAccent()]] - code - apps/api/src/lib/deck-prompt.ts
- [[publishContentEvent()]] - code - apps/api/src/services/events/jobEventAudience.ts
- [[publishContentEventTo()]] - code - apps/api/src/services/events/jobEventAudience.ts
- [[resolveContentAudience()]] - code - apps/api/src/services/events/jobEventAudience.ts
- [[slideToText()]] - code - apps/api/src/jobs/generateVideo.job.ts
- [[slides.service.ts]] - code - apps/api/src/services/slides.service.ts
- [[targetSlideCount()]] - code - apps/api/src/lib/deck-prompt.ts
- [[toBulletObjects()]] - code - apps/api/src/services/slides.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Job_Event_Fan-out__Media_Jobs
SORT file.name ASC
```

## Connections to other communities
- 31 edges to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 11 edges to [[_COMMUNITY_Content Media Controllers]]
- 8 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 7 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 6 edges to [[_COMMUNITY_Slide Deck Player UI]]
- 5 edges to [[_COMMUNITY_Podcast Generation & TTS]]
- 4 edges to [[_COMMUNITY_AI Provider Service]]
- 4 edges to [[_COMMUNITY_AI Tutor Chat Controller]]
- 3 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 3 edges to [[_COMMUNITY_Flashcards UI]]
- 3 edges to [[_COMMUNITY_Deck Schema]]
- 3 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 3 edges to [[_COMMUNITY_Section Controller]]
- 2 edges to [[_COMMUNITY_Quiz Generation Pipeline]]
- 2 edges to [[_COMMUNITY_Learner Controller]]
- 2 edges to [[_COMMUNITY_In-Process Job Event Bus]]
- 2 edges to [[_COMMUNITY_Usage Pricing & Metering]]
- 2 edges to [[_COMMUNITY_Web Providers & Job-Event Stream]]
- 1 edge to [[_COMMUNITY_Summary Controller]]
- 1 edge to [[_COMMUNITY_AI Prompt Builders]]
- 1 edge to [[_COMMUNITY_Subscription & Billing Service]]

## Top bridge nodes
- [[slides.service.ts]] - degree 61, connects to 13 communities
- [[generateVideo.job.ts]] - degree 27, connects to 8 communities
- [[jobEventAudience.ts]] - degree 19, connects to 7 communities
- [[generateSlides.job.ts]] - degree 15, connects to 4 communities
- [[DeckAudience]] - degree 7, connects to 4 communities