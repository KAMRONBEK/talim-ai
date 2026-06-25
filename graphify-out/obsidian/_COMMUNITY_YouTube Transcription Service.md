---
type: community
cohesion: 0.20
members: 15
---

# YouTube Transcription Service

**Cohesion:** 0.20 - loosely connected
**Members:** 15 nodes

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
- [[fallbackTextSegments()]] - code - apps/api/src/services/youtube.service.ts
- [[generateYoutubeTranscript()]] - code - apps/api/src/services/youtube.service.ts
- [[normalizeCaptionSegments()]] - code - apps/api/src/services/youtube.service.ts
- [[normalizeTranscriptionSegments()]] - code - apps/api/src/services/youtube.service.ts
- [[streamToBuffer()]] - code - apps/api/src/services/youtube.service.ts
- [[youtube.service.ts]] - code - apps/api/src/services/youtube.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/YouTube_Transcription_Service
SORT file.name ASC
```

## Connections to other communities
- 6 edges to [[_COMMUNITY_Tenant Content Controller]]
- 3 edges to [[_COMMUNITY_Env Config & Background Job Registration]]
- 3 edges to [[_COMMUNITY_Usage Pricing & PDF Extraction]]
- 1 edge to [[_COMMUNITY_Content Controller (B2C)]]
- 1 edge to [[_COMMUNITY_Embedding Inspection Script]]

## Top bridge nodes
- [[youtube.service.ts]] - degree 24, connects to 5 communities
- [[generateYoutubeTranscript()]] - degree 8, connects to 2 communities
- [[cleanTranscriptText()]] - degree 4, connects to 1 community
- [[normalizeCaptionSegments()]] - degree 2, connects to 1 community