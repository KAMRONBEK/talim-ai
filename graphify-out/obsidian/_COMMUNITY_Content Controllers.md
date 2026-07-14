---
type: community
cohesion: 0.14
members: 36
---

# Content Controllers

**Cohesion:** 0.14 - loosely connected
**Members:** 36 nodes

## Members
- [[assertCanMutateContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertIndividualContentRoute()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertTenantOwnsContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[buildContentListWhere()]] - code - apps/api/src/services/contentAccess.service.ts
- [[content-shared.ts]] - code - apps/api/src/controllers/content-shared.ts
- [[content.controller.ts_1]] - code - apps/api/src/controllers/content.controller.ts
- [[createYoutubeContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[createYoutubeContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[decodeUploadFilename()]] - code - apps/api/src/lib/filename.ts
- [[deleteContent()_2]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[emptyTranscript()]] - code - apps/api/src/controllers/content-shared.ts
- [[filename.ts]] - code - apps/api/src/lib/filename.ts
- [[formatContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[formatContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[formatTranscriptSegment()]] - code - apps/api/src/controllers/content-shared.ts
- [[getContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContentFile()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContentFile()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContentTranscript()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContentTranscript()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[listContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[listContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[loadOrBackfillTranscript()]] - code - apps/api/src/controllers/content-shared.ts
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
TABLE source_file, type FROM #community/Content_Controllers
SORT file.name ASC
```

## Connections to other communities
- 34 edges to [[_COMMUNITY_Content Access & Media API]]
- 25 edges to [[_COMMUNITY_Bull Jobs & Queues]]
- 16 edges to [[_COMMUNITY_Subscriptions & Quota]]
- 15 edges to [[_COMMUNITY_Ingest & Usage Services]]
- 5 edges to [[_COMMUNITY_Admin API Controllers]]
- 4 edges to [[_COMMUNITY_API Routing & Middleware]]
- 1 edge to [[_COMMUNITY_Tenant Progress & Mastery]]

## Top bridge nodes
- [[content.controller.ts_1]] - degree 51, connects to 6 communities
- [[tenant-content.controller.ts]] - degree 45, connects to 6 communities
- [[reparseContent()]] - degree 7, connects to 3 communities
- [[reparseContent()_1]] - degree 7, connects to 3 communities
- [[content-shared.ts]] - degree 18, connects to 2 communities