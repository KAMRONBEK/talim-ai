---
type: community
cohesion: 0.11
members: 51
---

# src controllers

**Cohesion:** 0.11 - loosely connected
**Members:** 51 nodes

## Members
- [[StoredSegment]] - code - apps/api/src/controllers/video.controller.ts
- [[assertCanAccessContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertCanGenerate()]] - code - apps/api/src/services/contentAccess.service.ts
- [[createFlashcards()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[createPodcast()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[createPodcastSchema]] - code - apps/api/src/controllers/podcast.controller.ts
- [[createVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[ensureSectionTitlesForLocale()]] - code - apps/api/src/services/section.service.ts
- [[episodeProgressSchema]] - code - apps/api/src/controllers/progress.controller.ts
- [[flashcards.controller.ts]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[flashcardsBodySchema]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[formatDeck()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[formatEpisode()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[formatSection()]] - code - apps/api/src/controllers/section.controller.ts
- [[formatSectionProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[formatVideo()]] - code - apps/api/src/controllers/video.controller.ts
- [[getContentChat()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getContentFile()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContentProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getContentTranscript()]] - code - apps/api/src/controllers/content.controller.ts
- [[getEpisodeProgress()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getFlashcards()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[getLearningHistory()]] - code - apps/api/src/controllers/progress.controller.ts
- [[getParam()]] - code - apps/api/src/lib/params.ts
- [[getPodcast()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[getSection()]] - code - apps/api/src/controllers/section.controller.ts
- [[getSectionBody()]] - code - apps/api/src/services/section.service.ts
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
- [[publicSegments()]] - code - apps/api/src/controllers/video.controller.ts
- [[regenerateEpisode()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[resolveLocale()]] - code - apps/api/src/lib/locale.ts
- [[resolveSectionTitle()]] - code - apps/api/src/services/section.service.ts
- [[scopeKey()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[scopeKey()_2]] - code - apps/api/src/controllers/video.controller.ts
- [[section.controller.ts]] - code - apps/api/src/controllers/section.controller.ts
- [[streamEpisodeAudio()]] - code - apps/api/src/controllers/podcast.controller.ts
- [[streamVideoSegmentAudio()]] - code - apps/api/src/controllers/video.controller.ts
- [[video.controller.ts]] - code - apps/api/src/controllers/video.controller.ts
- [[videoBodySchema]] - code - apps/api/src/controllers/video.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/src_controllers
SORT file.name ASC
```

## Connections to other communities
- 33 edges to [[_COMMUNITY_controllers admin]]
- 22 edges to [[_COMMUNITY_subscription]]
- 22 edges to [[_COMMUNITY_src controllers · content.controller.ts]]
- 16 edges to [[_COMMUNITY_src controllers · quiz.controller.ts]]
- 16 edges to [[_COMMUNITY_src controllers · summary.controller.ts]]
- 15 edges to [[_COMMUNITY_src routes]]
- 14 edges to [[_COMMUNITY_src services · slides.controller.ts]]
- 11 edges to [[_COMMUNITY_src controllers · sendContentFile()]]
- 10 edges to [[_COMMUNITY_src controllers · assessment.controller.ts]]
- 9 edges to [[_COMMUNITY_src controllers · chat.controller.ts]]
- 7 edges to [[_COMMUNITY_src services · learning-coverage-prompt.ts]]
- 7 edges to [[_COMMUNITY_src controllers · tenant.controller.ts]]
- 6 edges to [[_COMMUNITY_src jobs]]
- 5 edges to [[_COMMUNITY_src services · env.ts]]
- 5 edges to [[_COMMUNITY_src services]]
- 4 edges to [[_COMMUNITY_packages types · api.ts]]
- 3 edges to [[_COMMUNITY_packages types]]
- 1 edge to [[_COMMUNITY_i18n]]
- 1 edge to [[_COMMUNITY_components deck · DeckPlayer.tsx]]

## Top bridge nodes
- [[getParam()]] - degree 86, connects to 11 communities
- [[params.ts]] - degree 18, connects to 9 communities
- [[video.controller.ts]] - degree 32, connects to 8 communities
- [[section.controller.ts]] - degree 23, connects to 7 communities
- [[podcast.controller.ts]] - degree 27, connects to 6 communities