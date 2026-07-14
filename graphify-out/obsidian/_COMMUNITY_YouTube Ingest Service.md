---
type: community
cohesion: 0.21
members: 16
---

# YouTube Ingest Service

**Cohesion:** 0.21 - loosely connected
**Members:** 16 nodes

## Members
- [[OpenAITranscriptionSegment]] - code - apps/api/src/services/youtube.service.ts
- [[OpenAIVerboseTranscription]] - code - apps/api/src/services/youtube.service.ts
- [[TranscriptSegmentInput]] - code - apps/api/src/services/youtube.service.ts
- [[TranscriptSegmentSource]] - code - apps/api/src/services/youtube.service.ts
- [[YoutubeTranscriptItem]] - code - apps/api/src/services/youtube.service.ts
- [[YoutubeTranscriptResult]] - code - apps/api/src/services/youtube.service.ts
- [[buildTranscriptionPrompt()]] - code - apps/api/src/services/youtube.service.ts
- [[cleanTranscriptText()]] - code - apps/api/src/services/youtube.service.ts
- [[extractYoutubeAudio()]] - code - apps/api/src/services/youtube.service.ts
- [[extractYoutubeTranscript()]] - code - apps/api/src/services/youtube.service.ts
- [[fallbackTextSegments()]] - code - apps/api/src/services/youtube.service.ts
- [[generateYoutubeTranscript()]] - code - apps/api/src/services/youtube.service.ts
- [[normalizeCaptionSegments()]] - code - apps/api/src/services/youtube.service.ts
- [[normalizeTranscriptionSegments()]] - code - apps/api/src/services/youtube.service.ts
- [[streamToBuffer()]] - code - apps/api/src/services/youtube.service.ts
- [[youtube.service.ts]] - code - apps/api/src/services/youtube.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/YouTube_Ingest_Service
SORT file.name ASC
```

## Connections to other communities
- 6 edges to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 4 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 4 edges to [[_COMMUNITY_Usage Pricing & Metering]]

## Top bridge nodes
- [[youtube.service.ts]] - degree 25, connects to 3 communities
- [[extractYoutubeTranscript()]] - degree 7, connects to 2 communities
- [[generateYoutubeTranscript()]] - degree 8, connects to 1 community