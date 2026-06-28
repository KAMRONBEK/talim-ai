---
type: community
cohesion: 0.13
members: 29
---

# src services · env.ts

**Cohesion:** 0.13 - loosely connected
**Members:** 29 nodes

## Members
- [[Env]] - code - apps/api/src/config/env.ts
- [[OpenAITranscriptionSegment]] - code - apps/api/src/services/youtube.service.ts
- [[OpenAIVerboseTranscription]] - code - apps/api/src/services/youtube.service.ts
- [[StorageService]] - code - apps/api/src/services/storage.service.ts
- [[TranscriptSegmentInput]] - code - apps/api/src/services/youtube.service.ts
- [[TranscriptSegmentSource]] - code - apps/api/src/services/youtube.service.ts
- [[YoutubeTranscriptItem]] - code - apps/api/src/services/youtube.service.ts
- [[YoutubeTranscriptResult]] - code - apps/api/src/services/youtube.service.ts
- [[buildTranscriptionPrompt()]] - code - apps/api/src/services/youtube.service.ts
- [[cleanTranscriptText()]] - code - apps/api/src/services/youtube.service.ts
- [[content-shared.ts]] - code - apps/api/src/controllers/content-shared.ts
- [[env.ts]] - code - apps/api/src/config/env.ts
- [[envSchema]] - code - apps/api/src/config/env.ts
- [[extractYoutubeAudio()]] - code - apps/api/src/services/youtube.service.ts
- [[extractYoutubeTranscript()]] - code - apps/api/src/services/youtube.service.ts
- [[fallbackTextSegments()]] - code - apps/api/src/services/youtube.service.ts
- [[formatTranscriptSegment()]] - code - apps/api/src/controllers/content-shared.ts
- [[generateYoutubeTranscript()]] - code - apps/api/src/services/youtube.service.ts
- [[loadEnv()]] - code - apps/api/src/config/env.ts
- [[loadOrBackfillTranscript()]] - code - apps/api/src/controllers/content-shared.ts
- [[normalizeCaptionSegments()]] - code - apps/api/src/services/youtube.service.ts
- [[normalizeTranscriptionSegments()]] - code - apps/api/src/services/youtube.service.ts
- [[ocrRegionSchema]] - code - apps/api/src/controllers/content-shared.ts
- [[processContent.job.ts]] - code - apps/api/src/jobs/processContent.job.ts
- [[reparseSchema]] - code - apps/api/src/controllers/content-shared.ts
- [[storage.service.ts]] - code - apps/api/src/services/storage.service.ts
- [[streamToBuffer()]] - code - apps/api/src/services/youtube.service.ts
- [[youtube.service.ts]] - code - apps/api/src/services/youtube.service.ts
- [[youtubeSchema]] - code - apps/api/src/controllers/content-shared.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/src_services__envts
SORT file.name ASC
```

## Connections to other communities
- 20 edges to [[_COMMUNITY_src jobs]]
- 14 edges to [[_COMMUNITY_src controllers · sendContentFile()]]
- 12 edges to [[_COMMUNITY_src services · usage-pricing.ts]]
- 10 edges to [[_COMMUNITY_src controllers · content.controller.ts]]
- 9 edges to [[_COMMUNITY_src services]]
- 6 edges to [[_COMMUNITY_subscription]]
- 5 edges to [[_COMMUNITY_src controllers]]
- 4 edges to [[_COMMUNITY_src routes]]
- 4 edges to [[_COMMUNITY_src services · slides.controller.ts]]
- 3 edges to [[_COMMUNITY_controllers admin]]
- 2 edges to [[_COMMUNITY_services tenant]]
- 2 edges to [[_COMMUNITY_src services · TutorGraphIntent]]
- 2 edges to [[_COMMUNITY_src services · tts-normalize.ts]]
- 2 edges to [[_COMMUNITY_src controllers · chat.controller.ts]]
- 2 edges to [[_COMMUNITY_src services · LocalStorageService]]

## Top bridge nodes
- [[env.ts]] - degree 22, connects to 10 communities
- [[Env]] - degree 20, connects to 10 communities
- [[storage.service.ts]] - degree 16, connects to 7 communities
- [[StorageService]] - degree 14, connects to 7 communities
- [[processContent.job.ts]] - degree 26, connects to 6 communities