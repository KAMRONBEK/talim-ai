---
type: community
cohesion: 0.13
members: 38
---

# Podcast & Progress Controllers

**Cohesion:** 0.13 - loosely connected
**Members:** 38 nodes

## Members
- [[assertCanAccessContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertCanGenerate()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertQuota()]] - code - apps/api/src/services/subscription/user.ts
- [[createPodcast()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[createPodcastSchema]] - code - apps/api/src/controllers/podcast.controller.ts
- [[createQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[createSlides()]] - code - apps/api/src/controllers/slides.controller.ts
- [[createVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[episodeProgressSchema]] - code - apps/api/src/controllers/progress.controller.ts
- [[formatEpisode()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[formatSectionProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[formatSummary()]] - code - apps/api/src/controllers/summary.controller.ts
- [[formatVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[generateSummary()]] - code - apps/api/src/controllers/summary.controller.ts
- [[getContentChat()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getContentProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getEpisodeProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getLearningHistory()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getPodcast()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[getSlides()]] - code - apps/api/src/controllers/slides.controller.ts
- [[getSummary()_1]] - code - apps/api/src/controllers/summary.controller.ts
- [[getVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[locale.ts]] - code - apps/api/src/lib/locale.ts
- [[localeSchema]] - code - apps/api/src/lib/locale.ts
- [[patchContentProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[patchEpisodeProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[patchProgressSchema]] - code - apps/api/src/controllers/progress.controller.ts
- [[podcast.controller.ts]] - code - apps/api/src/controllers/podcast.controller.ts
- [[progress.controller.ts]] - code - apps/api/src/controllers/progress.controller.ts
- [[resolveLocale()]] - code - apps/api/src/lib/locale.ts
- [[scopeKey()]] - code - apps/api/src/controllers/summary.controller.ts
- [[scopeKey()_1]] - code - apps/api/src/controllers/video.controller.ts
- [[slides.controller.ts]] - code - apps/api/src/controllers/slides.controller.ts
- [[slidesBodySchema]] - code - apps/api/src/controllers/slides.controller.ts
- [[streamEpisodeAudio()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[summaryUserId()]] - code - apps/api/src/controllers/summary.controller.ts
- [[video.controller.ts]] - code - apps/api/src/controllers/video.controller.ts
- [[videoBodySchema]] - code - apps/api/src/controllers/video.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Podcast__Progress_Controllers
SORT file.name ASC
```

## Connections to other communities
- 24 edges to [[_COMMUNITY_Tutor-Request & Assessment Controllers]]
- 19 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 18 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 17 edges to [[_COMMUNITY_AI Summary Generation]]
- 13 edges to [[_COMMUNITY_API Middleware (authquotarate-limit)]]
- 11 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 11 edges to [[_COMMUNITY_AI Slide-Deck Prompting]]
- 7 edges to [[_COMMUNITY_Subscription Service]]
- 6 edges to [[_COMMUNITY_Chat Controller & Sessions]]
- 6 edges to [[_COMMUNITY_Learning Progress & Coverage Scoring]]
- 5 edges to [[_COMMUNITY_Env Config & Background Job Registration]]
- 5 edges to [[_COMMUNITY_Quota Smoke Test]]
- 2 edges to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 2 edges to [[_COMMUNITY_TTS Normalization Service]]
- 2 edges to [[_COMMUNITY_Tenant Content Controller]]
- 2 edges to [[_COMMUNITY_Web API Client & Locale]]
- 1 edge to [[_COMMUNITY_Tenant Service & Content Assignment]]

## Top bridge nodes
- [[assertQuota()]] - degree 29, connects to 10 communities
- [[slides.controller.ts]] - degree 25, connects to 8 communities
- [[podcast.controller.ts]] - degree 26, connects to 7 communities
- [[locale.ts]] - degree 13, connects to 7 communities
- [[progress.controller.ts]] - degree 25, connects to 6 communities