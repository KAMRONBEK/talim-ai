---
type: community
cohesion: 0.10
members: 50
---

# Media & Progress Controllers

**Cohesion:** 0.10 - loosely connected
**Members:** 50 nodes

## Members
- [[StoredSegment]] - code - apps/api/src/controllers/video.controller.ts
- [[assertCanAccessContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertCanGenerate()]] - code - apps/api/src/services/contentAccess.service.ts
- [[createFlashcards()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[createPodcast()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[createPodcastSchema]] - code - apps/api/src/controllers/podcast.controller.ts
- [[createQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[createSlides()]] - code - apps/api/src/controllers/slides.controller.ts
- [[createVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[episodeProgressSchema]] - code - apps/api/src/controllers/progress.controller.ts
- [[formatDeck()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[formatEpisode()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[formatSectionProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[formatSummary()]] - code - apps/api/src/controllers/summary.controller.ts
- [[formatVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[generateSummary()]] - code - apps/api/src/controllers/summary.controller.ts
- [[getContentChat()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getContentProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getEpisodeProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getFlashcards()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[getLearningHistory()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getPodcast()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[getSlides()]] - code - apps/api/src/controllers/slides.controller.ts
- [[getSummary()_1]] - code - apps/api/src/controllers/summary.controller.ts
- [[getVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[listQuizzesByContent()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[locale.ts]] - code - apps/api/src/lib/locale.ts
- [[localeSchema]] - code - apps/api/src/lib/locale.ts
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
- [[scopeKey()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[scopeKey()_1]] - code - apps/api/src/controllers/summary.controller.ts
- [[scopeKey()_2]] - code - apps/api/src/controllers/video.controller.ts
- [[slides.controller.ts]] - code - apps/api/src/controllers/slides.controller.ts
- [[slidesBodySchema]] - code - apps/api/src/controllers/slides.controller.ts
- [[streamEpisodeAudio()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[streamVideoSegmentAudio()]] - code - apps/api/src/controllers/video.controller.ts
- [[summary.controller.ts]] - code - apps/api/src/controllers/summary.controller.ts
- [[summaryBodySchema]] - code - apps/api/src/controllers/summary.controller.ts
- [[summaryUserId()]] - code - apps/api/src/controllers/summary.controller.ts
- [[video.controller.ts]] - code - apps/api/src/controllers/video.controller.ts
- [[videoBodySchema]] - code - apps/api/src/controllers/video.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Media__Progress_Controllers
SORT file.name ASC
```

## Connections to other communities
- 31 edges to [[_COMMUNITY_Assessment & Tutor-Request Controllers]]
- 30 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 25 edges to [[_COMMUNITY_Billing, Usage & Limits]]
- 10 edges to [[_COMMUNITY_Quiz API Controller]]
- 9 edges to [[_COMMUNITY_AI Tutor Chat API]]
- 9 edges to [[_COMMUNITY_Content API Controller]]
- 9 edges to [[_COMMUNITY_API Middleware]]
- 9 edges to [[_COMMUNITY_Section Service]]
- 9 edges to [[_COMMUNITY_Slide Deck Prompts]]
- 8 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 7 edges to [[_COMMUNITY_Background Jobs & Queues]]
- 6 edges to [[_COMMUNITY_Locale AI Prompts]]
- 5 edges to [[_COMMUNITY_Admin Content & Audit]]
- 5 edges to [[_COMMUNITY_Shared Types & Auth Stores]]
- 3 edges to [[_COMMUNITY_Content Grid & Learner Dashboard]]
- 2 edges to [[_COMMUNITY_AI Provider Service]]
- 2 edges to [[_COMMUNITY_Community 98]]
- 1 edge to [[_COMMUNITY_Podcast Generation & Prompts]]
- 1 edge to [[_COMMUNITY_Transcript Panel]]
- 1 edge to [[_COMMUNITY_Community 95]]
- 1 edge to [[_COMMUNITY_Community 99]]

## Top bridge nodes
- [[summary.controller.ts]] - degree 39, connects to 13 communities
- [[podcast.controller.ts]] - degree 30, connects to 9 communities
- [[video.controller.ts]] - degree 32, connects to 8 communities
- [[slides.controller.ts]] - degree 25, connects to 8 communities
- [[locale.ts]] - degree 14, connects to 7 communities