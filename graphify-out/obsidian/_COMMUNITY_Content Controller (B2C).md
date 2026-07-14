---
type: community
cohesion: 0.12
members: 41
---

# Content Controller (B2C)

**Cohesion:** 0.12 - loosely connected
**Members:** 41 nodes

## Members
- [[TRANSCRIPT_LIVE_STATES]] - code - apps/api/src/controllers/content-shared.ts
- [[assertCanMutateContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertTenantOwnsContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[buildContentListWhere()]] - code - apps/api/src/services/contentAccess.service.ts
- [[cancelContentJobs()]] - code - apps/api/src/services/queue.service.ts
- [[content-shared.ts]] - code - apps/api/src/controllers/content-shared.ts
- [[content.controller.ts_1]] - code - apps/api/src/controllers/content.controller.ts
- [[createYoutubeContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[createYoutubeContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[decodeUploadFilename()]] - code - apps/api/src/lib/filename.ts
- [[deleteContent()_1]] - code - apps/api/src/controllers/content.controller.ts
- [[deleteContent()_2]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[emptyTranscript()]] - code - apps/api/src/controllers/content-shared.ts
- [[enqueueReparse()]] - code - apps/api/src/controllers/content-shared.ts
- [[extractYoutubeVideoId()]] - code - apps/api/src/services/youtube.service.ts
- [[filename.ts]] - code - apps/api/src/lib/filename.ts
- [[formatContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[formatContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[formatTranscriptSegment()]] - code - apps/api/src/controllers/content-shared.ts
- [[getContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContentFile()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContentTranscript()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContentTranscript()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[listContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[listContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[loadOrBackfillTranscript()]] - code - apps/api/src/controllers/content-shared.ts
- [[ocrPdfRegion()]] - code - apps/api/src/controllers/content.controller.ts
- [[ocrPdfRegion()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[ocrRegionSchema]] - code - apps/api/src/controllers/content-shared.ts
- [[reparseContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[reparseContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[reparseSchema]] - code - apps/api/src/controllers/content-shared.ts
- [[requireTenantId()]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[retryContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[retryContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[sendContentFile()]] - code - apps/api/src/controllers/content-shared.ts
- [[tenant-content.controller.ts]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[uploadContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[uploadContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[youtubeSchema]] - code - apps/api/src/controllers/content-shared.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Content_Controller_B2C
SORT file.name ASC
```

## Connections to other communities
- 17 edges to [[_COMMUNITY_Content Media Controllers]]
- 15 edges to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 15 edges to [[_COMMUNITY_Assessment Controller]]
- 13 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 8 edges to [[_COMMUNITY_PDF Extraction Service]]
- 7 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 6 edges to [[_COMMUNITY_Subscription & Billing Service]]
- 4 edges to [[_COMMUNITY_Admin Content & Audit Controllers]]
- 4 edges to [[_COMMUNITY_API Routes & Middleware]]
- 4 edges to [[_COMMUNITY_YouTube Ingest Service]]
- 3 edges to [[_COMMUNITY_Job Event Fan-out & Media Jobs]]
- 2 edges to [[_COMMUNITY_Usage Pricing & Metering]]

## Top bridge nodes
- [[content.controller.ts_1]] - degree 49, connects to 10 communities
- [[tenant-content.controller.ts]] - degree 43, connects to 10 communities
- [[content-shared.ts]] - degree 25, connects to 5 communities
- [[ocrPdfRegion()]] - degree 4, connects to 3 communities
- [[reparseContent()]] - degree 7, connects to 2 communities