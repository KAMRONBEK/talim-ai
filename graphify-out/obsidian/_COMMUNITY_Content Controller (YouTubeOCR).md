---
type: community
cohesion: 0.11
members: 49
---

# Content Controller (YouTube/OCR)

**Cohesion:** 0.11 - loosely connected
**Members:** 49 nodes

## Members
- [[BackfillTranscriptJobData]] - code - apps/api/src/services/queue.service.ts
- [[TRANSCRIPT_LIVE_STATES]] - code - apps/api/src/controllers/content-shared.ts
- [[assertCanMutateContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertIndividualContentRoute()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertTenantOwnsContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[buildContentListWhere()]] - code - apps/api/src/services/contentAccess.service.ts
- [[content-shared.ts]] - code - apps/api/src/controllers/content-shared.ts
- [[content.controller.ts_1]] - code - apps/api/src/controllers/content.controller.ts
- [[contentAccess.service.ts]] - code - apps/api/src/services/contentAccess.service.ts
- [[createYoutubeContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[createYoutubeContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[decodeUploadFilename()]] - code - apps/api/src/lib/filename.ts
- [[deleteContent()_1]] - code - apps/api/src/controllers/content.controller.ts
- [[deleteContent()_2]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[emptyTranscript()]] - code - apps/api/src/controllers/content-shared.ts
- [[enqueueReparse()]] - code - apps/api/src/controllers/content-shared.ts
- [[extractRegionTextFromImage()]] - code - apps/api/src/services/pdf.service.ts
- [[filename.ts]] - code - apps/api/src/lib/filename.ts
- [[formatContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[formatContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[formatTranscriptSegment()]] - code - apps/api/src/controllers/content-shared.ts
- [[getContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContentFile()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContentFile()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContentTranscript()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContentTranscript()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getParam()]] - code - apps/api/src/lib/params.ts
- [[getPdfPageCount()]] - code - apps/api/src/services/pdf.service.ts
- [[listContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[listContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[loadOrBackfillTranscript()]] - code - apps/api/src/controllers/content-shared.ts
- [[ocrImageDataUrl()]] - code - apps/api/src/services/pdf.service.ts
- [[ocrPdfRegion()]] - code - apps/api/src/controllers/content.controller.ts
- [[ocrPdfRegion()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[ocrRegionSchema]] - code - apps/api/src/controllers/content-shared.ts
- [[params.ts]] - code - apps/api/src/lib/params.ts
- [[reparseContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[reparseContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[reparseSchema]] - code - apps/api/src/controllers/content-shared.ts
- [[requireTenantId()]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[retryContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[retryContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[sendContentFile()]] - code - apps/api/src/controllers/content-shared.ts
- [[tenant-content.controller.ts]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[transcriptQueue]] - code - apps/api/src/services/queue.service.ts
- [[uploadContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[uploadContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[youtubeSchema]] - code - apps/api/src/controllers/content-shared.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Content_Controller_YouTube/OCR
SORT file.name ASC
```

## Connections to other communities
- 51 edges to [[_COMMUNITY_Flashcards & Podcast Controllers]]
- 32 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 27 edges to [[_COMMUNITY_Audit & Content Management]]
- 23 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 16 edges to [[_COMMUNITY_Assessment Controller]]
- 9 edges to [[_COMMUNITY_Embedding & Chunk Inspection]]
- 9 edges to [[_COMMUNITY_Tenant Student Management]]
- 8 edges to [[_COMMUNITY_Quiz Controller]]
- 6 edges to [[_COMMUNITY_YouTube Transcription Service]]
- 6 edges to [[_COMMUNITY_Summary Controller]]
- 4 edges to [[_COMMUNITY_Chat Controller (SSE)]]
- 4 edges to [[_COMMUNITY_Learner API Controller]]
- 4 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 2 edges to [[_COMMUNITY_Auth Controller]]
- 1 edge to [[_COMMUNITY_Root Layout & Fonts]]
- 1 edge to [[_COMMUNITY_Section Mastery Service]]

## Top bridge nodes
- [[getParam()]] - degree 101, connects to 11 communities
- [[contentAccess.service.ts]] - degree 31, connects to 10 communities
- [[params.ts]] - degree 19, connects to 8 communities
- [[content.controller.ts_1]] - degree 49, connects to 7 communities
- [[tenant-content.controller.ts]] - degree 43, connects to 6 communities