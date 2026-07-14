---
type: community
cohesion: 0.10
members: 50
---

# Content Media Controllers

**Cohesion:** 0.10 - loosely connected
**Members:** 50 nodes

## Members
- [[ReviewRow]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[StoredSegment]] - code - apps/api/src/controllers/video.controller.ts
- [[assertCanAccessContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertCanGenerate()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertQuota()]] - code - apps/api/src/services/subscription/user.ts
- [[createFlashcards()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[createPodcast()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[createPodcastSchema]] - code - apps/api/src/controllers/podcast.controller.ts
- [[createQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[createSlides()]] - code - apps/api/src/controllers/slides.controller.ts
- [[createVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[episodeProgressSchema]] - code - apps/api/src/controllers/progress.controller.ts
- [[flashcards.controller.ts]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[flashcardsBodySchema]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[formatDeck()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[formatEpisode()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[formatSectionProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[formatVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[getContentChat()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getContentFile()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContentProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getEpisodeProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getFlashcards()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[getLearningHistory()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getPodcast()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[getSlides()]] - code - apps/api/src/controllers/slides.controller.ts
- [[getVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[locale.ts]] - code - apps/api/src/lib/locale.ts
- [[localeSchema]] - code - apps/api/src/lib/locale.ts
- [[params.ts]] - code - apps/api/src/lib/params.ts
- [[parseSegments()]] - code - apps/api/src/controllers/video.controller.ts
- [[patchContentProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[patchEpisodeProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[patchProgressSchema]] - code - apps/api/src/controllers/progress.controller.ts
- [[podcast.controller.ts]] - code - apps/api/src/controllers/podcast.controller.ts
- [[progress.controller.ts]] - code - apps/api/src/controllers/progress.controller.ts
- [[publicSegments()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[publicSegments()_1]] - code - apps/api/src/controllers/video.controller.ts
- [[regenerateEpisode()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[resolveLocale()]] - code - apps/api/src/lib/locale.ts
- [[reviewBodySchema_1]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[reviewFlashcard()_1]] - code - apps/api/src/services/srs.service.ts
- [[scopeKey()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[scopeKey()_2]] - code - apps/api/src/controllers/video.controller.ts
- [[slides.controller.ts]] - code - apps/api/src/controllers/slides.controller.ts
- [[slidesBodySchema]] - code - apps/api/src/controllers/slides.controller.ts
- [[streamEpisodeAudio()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[streamVideoSegmentAudio()]] - code - apps/api/src/controllers/video.controller.ts
- [[video.controller.ts]] - code - apps/api/src/controllers/video.controller.ts
- [[videoBodySchema]] - code - apps/api/src/controllers/video.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Content_Media_Controllers
SORT file.name ASC
```

## Connections to other communities
- 26 edges to [[_COMMUNITY_Assessment Controller]]
- 20 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 17 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 16 edges to [[_COMMUNITY_API Routes & Middleware]]
- 16 edges to [[_COMMUNITY_Summary Controller]]
- 14 edges to [[_COMMUNITY_Subscription & Billing Service]]
- 13 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 12 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 11 edges to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 11 edges to [[_COMMUNITY_Job Event Fan-out & Media Jobs]]
- 9 edges to [[_COMMUNITY_Admin Content & Audit Controllers]]
- 8 edges to [[_COMMUNITY_Section Controller]]
- 7 edges to [[_COMMUNITY_AI Tutor Chat Controller]]
- 4 edges to [[_COMMUNITY_Learner Controller]]
- 4 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 3 edges to [[_COMMUNITY_Section Mastery (Elo-KT)]]
- 3 edges to [[_COMMUNITY_Learning Progress & Coverage]]
- 2 edges to [[_COMMUNITY_Flashcards UI]]
- 1 edge to [[_COMMUNITY_Transcript Panel UI]]
- 1 edge to [[_COMMUNITY_Narrated Video Player]]

## Top bridge nodes
- [[video.controller.ts]] - degree 32, connects to 9 communities
- [[podcast.controller.ts]] - degree 30, connects to 9 communities
- [[slides.controller.ts]] - degree 25, connects to 9 communities
- [[assertQuota()]] - degree 35, connects to 8 communities
- [[flashcards.controller.ts]] - degree 31, connects to 8 communities