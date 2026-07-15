---
type: community
cohesion: 0.08
members: 61
---

# Flashcards & Podcast Controllers

**Cohesion:** 0.08 - loosely connected
**Members:** 61 nodes

## Members
- [[ReviewRow]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[StoredSegment]] - code - apps/api/src/controllers/video.controller.ts
- [[assertCanAccessContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertCanGenerate()]] - code - apps/api/src/services/contentAccess.service.ts
- [[createFlashcards()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[createPodcast()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[createPodcastSchema]] - code - apps/api/src/controllers/podcast.controller.ts
- [[createQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[createSlides()]] - code - apps/api/src/controllers/slides.controller.ts
- [[createVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[deckScopeKey()]] - code - apps/api/src/services/slides.service.ts
- [[enqueueSlideDeckGeneration()]] - code - apps/api/src/services/slides.service.ts
- [[ensureSectionTitlesForLocale()]] - code - apps/api/src/services/section.service.ts
- [[episodeProgressSchema]] - code - apps/api/src/controllers/progress.controller.ts
- [[flashcards.controller.ts]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[flashcardsBodySchema]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[formatDeck()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[formatEpisode()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[formatSection()]] - code - apps/api/src/controllers/section.controller.ts
- [[formatSectionProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[formatSlideDeck()]] - code - apps/api/src/services/slides.service.ts
- [[formatVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[getContentChat()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getContentMastery()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getContentProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getEpisodeProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getFlashcards()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[getLearningHistory()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getPodcast()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[getReadySlideDeckAnyLocale()]] - code - apps/api/src/services/slides.service.ts
- [[getSection()]] - code - apps/api/src/controllers/section.controller.ts
- [[getSlideDeck()]] - code - apps/api/src/services/slides.service.ts
- [[getSlides()]] - code - apps/api/src/controllers/slides.controller.ts
- [[getVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[listQuizzesByContent()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[listSections()]] - code - apps/api/src/controllers/section.controller.ts
- [[locale.ts]] - code - apps/api/src/lib/locale.ts
- [[parseAppLocale()]] - code - packages/types/locale.ts
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
- [[reviewFlashcard()_1]] - code - apps/api/src/services/srs.service.ts
- [[scopeKey()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[scopeKey()_2]] - code - apps/api/src/controllers/video.controller.ts
- [[section.controller.ts]] - code - apps/api/src/controllers/section.controller.ts
- [[slides.controller.ts]] - code - apps/api/src/controllers/slides.controller.ts
- [[slidesBodySchema]] - code - apps/api/src/controllers/slides.controller.ts
- [[streamEpisodeAudio()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[streamVideoSegmentAudio()]] - code - apps/api/src/controllers/video.controller.ts
- [[translateSectionTitles()]] - code - apps/api/src/services/section.service.ts
- [[video.controller.ts]] - code - apps/api/src/controllers/video.controller.ts
- [[videoBodySchema]] - code - apps/api/src/controllers/video.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Flashcards__Podcast_Controllers
SORT file.name ASC
```

## Connections to other communities
- 51 edges to [[_COMMUNITY_Content Controller (YouTubeOCR)]]
- 47 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 26 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 14 edges to [[_COMMUNITY_Summary Controller]]
- 12 edges to [[_COMMUNITY_Assessment Controller]]
- 10 edges to [[_COMMUNITY_Quiz Controller]]
- 8 edges to [[_COMMUNITY_Audit & Content Management]]
- 8 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 6 edges to [[_COMMUNITY_Chat Controller (SSE)]]
- 5 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 4 edges to [[_COMMUNITY_Embedding & Chunk Inspection]]
- 3 edges to [[_COMMUNITY_Section Mastery Service]]
- 3 edges to [[_COMMUNITY_Flashcards Page]]
- 2 edges to [[_COMMUNITY_Auth Controller]]
- 2 edges to [[_COMMUNITY_Learner API Controller]]
- 2 edges to [[_COMMUNITY_Tenant Student Management]]
- 2 edges to [[_COMMUNITY_Bank & Question Management]]
- 2 edges to [[_COMMUNITY_API Client & Locale Routing]]
- 1 edge to [[_COMMUNITY_Transcript Panel & Video Viewer]]
- 1 edge to [[_COMMUNITY_Narrated Video Player]]
- 1 edge to [[_COMMUNITY_Quiz Generation Job]]

## Top bridge nodes
- [[section.controller.ts]] - degree 23, connects to 9 communities
- [[parseAppLocale()]] - degree 22, connects to 9 communities
- [[video.controller.ts]] - degree 32, connects to 7 communities
- [[podcast.controller.ts]] - degree 30, connects to 7 communities
- [[slides.controller.ts]] - degree 25, connects to 7 communities