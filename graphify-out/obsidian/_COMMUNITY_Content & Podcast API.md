---
type: community
cohesion: 0.11
members: 49
---

# Content & Podcast API

**Cohesion:** 0.11 - loosely connected
**Members:** 49 nodes

## Members
- [[StoredSegment]] - code - apps/api/src/controllers/video.controller.ts
- [[assertCanAccessContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertCanGenerate()]] - code - apps/api/src/services/contentAccess.service.ts
- [[createPodcast()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[createPodcastSchema]] - code - apps/api/src/controllers/podcast.controller.ts
- [[createSlides()]] - code - apps/api/src/controllers/slides.controller.ts
- [[createVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[deckScopeKey()]] - code - apps/api/src/services/slides.service.ts
- [[episodeProgressSchema]] - code - apps/api/src/controllers/progress.controller.ts
- [[formatEpisode()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[formatSectionProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[formatSlideDeck()]] - code - apps/api/src/services/slides.service.ts
- [[formatVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[generateAndStoreSlideDeck()]] - code - apps/api/src/services/slides.service.ts
- [[getContentChat()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getContentFile()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContentProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getContentTranscript()]] - code - apps/api/src/controllers/content.controller.ts
- [[getEpisodeProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getLearningHistory()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getParam()]] - code - apps/api/src/lib/params.ts
- [[getPodcast()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[getReadySlideDeckAnyLocale()]] - code - apps/api/src/services/slides.service.ts
- [[getSlideDeck()]] - code - apps/api/src/services/slides.service.ts
- [[getSlides()]] - code - apps/api/src/controllers/slides.controller.ts
- [[getVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[listQuizzesByContent()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[listSections()]] - code - apps/api/src/controllers/section.controller.ts
- [[locale.ts]] - code - apps/api/src/lib/locale.ts
- [[localeSchema]] - code - apps/api/src/lib/locale.ts
- [[markSectionViewed()]] - code - apps/api/src/services/learningProgress.service.ts
- [[ocrPdfRegion()]] - code - apps/api/src/controllers/content.controller.ts
- [[params.ts]] - code - apps/api/src/lib/params.ts
- [[parseSegments()]] - code - apps/api/src/controllers/video.controller.ts
- [[patchContentProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[patchEpisodeProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[patchProgressSchema]] - code - apps/api/src/controllers/progress.controller.ts
- [[podcast.controller.ts]] - code - apps/api/src/controllers/podcast.controller.ts
- [[progress.controller.ts]] - code - apps/api/src/controllers/progress.controller.ts
- [[publicSegments()]] - code - apps/api/src/controllers/video.controller.ts
- [[regenerateEpisode()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[resolveLocale()]] - code - apps/api/src/lib/locale.ts
- [[scopeKey()_1]] - code - apps/api/src/controllers/video.controller.ts
- [[slides.controller.ts]] - code - apps/api/src/controllers/slides.controller.ts
- [[slidesBodySchema]] - code - apps/api/src/controllers/slides.controller.ts
- [[streamEpisodeAudio()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[streamVideoSegmentAudio()]] - code - apps/api/src/controllers/video.controller.ts
- [[video.controller.ts]] - code - apps/api/src/controllers/video.controller.ts
- [[videoBodySchema]] - code - apps/api/src/controllers/video.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Content__Podcast_API
SORT file.name ASC
```

## Connections to other communities
- 34 edges to [[_COMMUNITY_Content Controller]]
- 24 edges to [[_COMMUNITY_Section & Summary API]]
- 19 edges to [[_COMMUNITY_Admin Analytics & Subscriptions]]
- 19 edges to [[_COMMUNITY_Quiz Controller]]
- 16 edges to [[_COMMUNITY_Billing & Usage API]]
- 15 edges to [[_COMMUNITY_Tenant Admin & Prisma]]
- 12 edges to [[_COMMUNITY_Admin Audit & Auth]]
- 10 edges to [[_COMMUNITY_Community 62]]
- 10 edges to [[_COMMUNITY_Env Config & Jobs]]
- 9 edges to [[_COMMUNITY_Community 48]]
- 7 edges to [[_COMMUNITY_Deck Prompt Builder]]
- 7 edges to [[_COMMUNITY_Community 63]]
- 4 edges to [[_COMMUNITY_Community 35]]
- 3 edges to [[_COMMUNITY_Slide Deck Types]]
- 1 edge to [[_COMMUNITY_App Layout & Guards]]
- 1 edge to [[_COMMUNITY_Community 65]]
- 1 edge to [[_COMMUNITY_Community 44]]
- 1 edge to [[_COMMUNITY_Community 80]]

## Top bridge nodes
- [[getParam()]] - degree 83, connects to 10 communities
- [[slides.controller.ts]] - degree 25, connects to 9 communities
- [[video.controller.ts]] - degree 32, connects to 8 communities
- [[params.ts]] - degree 17, connects to 8 communities
- [[podcast.controller.ts]] - degree 27, connects to 6 communities