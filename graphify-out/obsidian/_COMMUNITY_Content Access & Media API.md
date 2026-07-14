---
type: community
cohesion: 0.09
members: 64
---

# Content Access & Media API

**Cohesion:** 0.09 - loosely connected
**Members:** 64 nodes

## Members
- [[AuthPayload]] - code - apps/api/src/middleware/auth.middleware.ts
- [[AuthenticatedRequest]] - code - apps/api/src/middleware/auth.middleware.ts
- [[FlashcardGrade]] - code - apps/api/src/services/srs.service.ts
- [[FlashcardReviewResult]] - code - apps/api/src/services/srs.service.ts
- [[GRADE_QUALITY]] - code - apps/api/src/services/srs.service.ts
- [[ReviewRow]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[StoredSegment]] - code - apps/api/src/controllers/video.controller.ts
- [[assertCanAccessContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertCanGenerate()]] - code - apps/api/src/services/contentAccess.service.ts
- [[contentAccess.service.ts]] - code - apps/api/src/services/contentAccess.service.ts
- [[createFlashcards()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[createPodcast()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[createPodcastSchema]] - code - apps/api/src/controllers/podcast.controller.ts
- [[createQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[createVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[deleteContent()_1]] - code - apps/api/src/controllers/content.controller.ts
- [[ensureSectionTitlesForLocale()]] - code - apps/api/src/services/section.service.ts
- [[episodeProgressSchema]] - code - apps/api/src/controllers/progress.controller.ts
- [[flashcards.controller.ts]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[flashcardsBodySchema]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[formatDeck()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[formatEpisode()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[formatSection()]] - code - apps/api/src/controllers/section.controller.ts
- [[formatSectionProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[formatVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[getContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContentChat()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getContentMastery()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getContentProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getEpisodeProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getFlashcards()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[getLearningHistory()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getParam()]] - code - apps/api/src/lib/params.ts
- [[getPodcast()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[getSection()]] - code - apps/api/src/controllers/section.controller.ts
- [[getVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[listQuizzesByContent()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[listSections()]] - code - apps/api/src/controllers/section.controller.ts
- [[locale.ts]] - code - apps/api/src/lib/locale.ts
- [[localeSchema]] - code - apps/api/src/lib/locale.ts
- [[ocrPdfRegion()]] - code - apps/api/src/controllers/content.controller.ts
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
- [[resolveSectionTitle()]] - code - apps/api/src/services/section.service.ts
- [[reviewBodySchema_1]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[reviewFlashcard()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[reviewFlashcard()_1]] - code - apps/api/src/services/srs.service.ts
- [[scopeKey()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[scopeKey()_2]] - code - apps/api/src/controllers/video.controller.ts
- [[section.controller.ts]] - code - apps/api/src/controllers/section.controller.ts
- [[srs.service.ts]] - code - apps/api/src/services/srs.service.ts
- [[streamEpisodeAudio()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[streamVideoSegmentAudio()]] - code - apps/api/src/controllers/video.controller.ts
- [[video.controller.ts]] - code - apps/api/src/controllers/video.controller.ts
- [[videoBodySchema]] - code - apps/api/src/controllers/video.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Content_Access__Media_API
SORT file.name ASC
```

## Connections to other communities
- 46 edges to [[_COMMUNITY_API Routing & Middleware]]
- 34 edges to [[_COMMUNITY_Content Controllers]]
- 31 edges to [[_COMMUNITY_Admin API Controllers]]
- 27 edges to [[_COMMUNITY_Subscriptions & Quota]]
- 25 edges to [[_COMMUNITY_AI Summary & Ingest]]
- 24 edges to [[_COMMUNITY_Bull Jobs & Queues]]
- 18 edges to [[_COMMUNITY_Quiz API]]
- 15 edges to [[_COMMUNITY_Tenant Progress & Mastery]]
- 15 edges to [[_COMMUNITY_Slide Deck Generation]]
- 11 edges to [[_COMMUNITY_Chat Streaming API]]
- 4 edges to [[_COMMUNITY_Shared Types & Locale]]
- 3 edges to [[_COMMUNITY_Elo-KT Section Mastery]]
- 3 edges to [[_COMMUNITY_Learning Progress Service]]
- 2 edges to [[_COMMUNITY_Auth & Tenant Services]]
- 2 edges to [[_COMMUNITY_Content Stage & Limits]]
- 1 edge to [[_COMMUNITY_Admin Analytics]]
- 1 edge to [[_COMMUNITY_Locale Routing]]
- 1 edge to [[_COMMUNITY_Ingest & Usage Services]]
- 1 edge to [[_COMMUNITY_Media Players]]
- 1 edge to [[_COMMUNITY_Grading Engine]]
- 1 edge to [[_COMMUNITY_Narrated Video & Deck Player]]

## Top bridge nodes
- [[contentAccess.service.ts]] - degree 31, connects to 11 communities
- [[AuthenticatedRequest]] - degree 29, connects to 11 communities
- [[getParam()]] - degree 101, connects to 10 communities
- [[params.ts]] - degree 19, connects to 8 communities
- [[locale.ts]] - degree 14, connects to 7 communities