---
type: community
cohesion: 0.09
members: 38
---

# Ingest & Usage Services

**Cohesion:** 0.09 - loosely connected
**Members:** 38 nodes

## Members
- [[OpenAITranscriptionSegment]] - code - apps/api/src/services/youtube.service.ts
- [[OpenAIVerboseTranscription]] - code - apps/api/src/services/youtube.service.ts
- [[OpenRouterFileAnnotation]] - code - apps/api/src/services/pdf.service.ts
- [[RecordUsageInput]] - code - apps/api/src/services/usage.service.ts
- [[TranscriptSegmentInput]] - code - apps/api/src/services/youtube.service.ts
- [[TranscriptSegmentSource]] - code - apps/api/src/services/youtube.service.ts
- [[UsageContext]] - code - apps/api/src/services/usage.service.ts
- [[YoutubeTranscriptItem]] - code - apps/api/src/services/youtube.service.ts
- [[YoutubeTranscriptResult]] - code - apps/api/src/services/youtube.service.ts
- [[buildTranscriptionPrompt()]] - code - apps/api/src/services/youtube.service.ts
- [[captionPage()]] - code - apps/api/src/services/figure.service.ts
- [[cleanTranscriptText()]] - code - apps/api/src/services/youtube.service.ts
- [[extractPdfPageRange()]] - code - apps/api/src/services/pdf.service.ts
- [[extractPdfText()]] - code - apps/api/src/services/pdf.service.ts
- [[extractRegionTextFromImage()]] - code - apps/api/src/services/pdf.service.ts
- [[extractTextFromPageImages()]] - code - apps/api/src/services/pdf.service.ts
- [[extractWithOpenAI()]] - code - apps/api/src/services/pdf.service.ts
- [[extractWithPdfParse()]] - code - apps/api/src/services/pdf.service.ts
- [[extractYoutubeAudio()]] - code - apps/api/src/services/youtube.service.ts
- [[extractYoutubeTranscript()]] - code - apps/api/src/services/youtube.service.ts
- [[extractYoutubeVideoId()]] - code - apps/api/src/services/youtube.service.ts
- [[fallbackTextSegments()]] - code - apps/api/src/services/youtube.service.ts
- [[generateYoutubeTranscript()]] - code - apps/api/src/services/youtube.service.ts
- [[getPdfPageCount()]] - code - apps/api/src/services/pdf.service.ts
- [[hasPrimaryOcrProvider()]] - code - apps/api/src/services/pdf.service.ts
- [[normalizeCaptionSegments()]] - code - apps/api/src/services/youtube.service.ts
- [[normalizeTranscriptionSegments()]] - code - apps/api/src/services/youtube.service.ts
- [[ocrImageDataUrl()]] - code - apps/api/src/services/pdf.service.ts
- [[ocrRequestOnce()]] - code - apps/api/src/services/pdf.service.ts
- [[ocrViaOpenRouter()]] - code - apps/api/src/services/pdf.service.ts
- [[pdf.service.ts]] - code - apps/api/src/services/pdf.service.ts
- [[rasterizeAndOcrPdf()]] - code - apps/api/src/services/pdf.service.ts
- [[recordUsage()]] - code - apps/api/src/services/usage.service.ts
- [[runCli()]] - code - apps/api/src/services/pdf.service.ts
- [[runPdftoppm()]] - code - apps/api/src/services/pdf.service.ts
- [[streamToBuffer()]] - code - apps/api/src/services/youtube.service.ts
- [[usage.service.ts]] - code - apps/api/src/services/usage.service.ts
- [[youtube.service.ts]] - code - apps/api/src/services/youtube.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Ingest__Usage_Services
SORT file.name ASC
```

## Connections to other communities
- 18 edges to [[_COMMUNITY_Bull Jobs & Queues]]
- 15 edges to [[_COMMUNITY_Content Controllers]]
- 5 edges to [[_COMMUNITY_AI Summary & Ingest]]
- 4 edges to [[_COMMUNITY_Usage Pricing]]
- 4 edges to [[_COMMUNITY_Subscriptions & Quota]]
- 4 edges to [[_COMMUNITY_Embeddings Service]]
- 4 edges to [[_COMMUNITY_TTS Synthesis]]
- 2 edges to [[_COMMUNITY_RAG Retrieval]]
- 1 edge to [[_COMMUNITY_Admin API Controllers]]
- 1 edge to [[_COMMUNITY_Content Access & Media API]]

## Top bridge nodes
- [[usage.service.ts]] - degree 22, connects to 9 communities
- [[UsageContext]] - degree 9, connects to 6 communities
- [[recordUsage()]] - degree 16, connects to 5 communities
- [[youtube.service.ts]] - degree 25, connects to 2 communities
- [[pdf.service.ts]] - degree 24, connects to 2 communities