---
type: community
cohesion: 0.15
members: 36
---

# Content Upload & Ingest

**Cohesion:** 0.15 - loosely connected
**Members:** 36 nodes

## Members
- [[StorageService]] - code - apps/api/src/services/storage.service.ts
- [[assertCanMutateContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertIndividualContentRoute()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertTenantOwnsContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[autoGenerateSectionDecks()]] - code - apps/api/src/services/slides.service.ts
- [[captionAndStoreFigures()]] - code - apps/api/src/services/figure.service.ts
- [[content-shared.ts]] - code - apps/api/src/controllers/content-shared.ts
- [[content.controller.ts_1]] - code - apps/api/src/controllers/content.controller.ts
- [[createYoutubeContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[createYoutubeContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[decodeUploadFilename()]] - code - apps/api/src/lib/filename.ts
- [[deleteContent()_2]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[extractRegionTextFromImage()]] - code - apps/api/src/services/pdf.service.ts
- [[extractTextFromPageImages()]] - code - apps/api/src/services/pdf.service.ts
- [[filename.ts]] - code - apps/api/src/lib/filename.ts
- [[formatContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[formatContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[formatTranscriptSegment()]] - code - apps/api/src/controllers/content-shared.ts
- [[getContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContentFile()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContentTranscript()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
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
TABLE source_file, type FROM #community/Content_Upload__Ingest
SORT file.name ASC
```

## Connections to other communities
- 29 edges to [[_COMMUNITY_Content API Controllers]]
- 19 edges to [[_COMMUNITY_Env Config & Job Events]]
- 16 edges to [[_COMMUNITY_Admin Tenants & Prisma Core]]
- 12 edges to [[_COMMUNITY_Community 50]]
- 12 edges to [[_COMMUNITY_Billing & Quota]]
- 9 edges to [[_COMMUNITY_AI Tutor Chat API]]
- 9 edges to [[_COMMUNITY_Community 68]]
- 6 edges to [[_COMMUNITY_Admin & Usage Controllers]]
- 5 edges to [[_COMMUNITY_Slide Deck Prompts]]
- 4 edges to [[_COMMUNITY_Admin Content & Audit]]
- 2 edges to [[_COMMUNITY_Community 92]]
- 1 edge to [[_COMMUNITY_Podcast Generation & TTS]]
- 1 edge to [[_COMMUNITY_Community 117]]

## Top bridge nodes
- [[content.controller.ts_1]] - degree 57, connects to 11 communities
- [[tenant-content.controller.ts]] - degree 51, connects to 10 communities
- [[StorageService]] - degree 14, connects to 6 communities
- [[content-shared.ts]] - degree 18, connects to 4 communities
- [[reparseContent()]] - degree 10, connects to 3 communities