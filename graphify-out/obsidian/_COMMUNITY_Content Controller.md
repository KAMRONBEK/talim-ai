---
type: community
cohesion: 0.14
members: 38
---

# Content Controller

**Cohesion:** 0.14 - loosely connected
**Members:** 38 nodes

## Members
- [[assertCanMutateContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertIndividualContentRoute()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertTenantOwnsContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[autoGenerateSectionDecks()]] - code - apps/api/src/services/slides.service.ts
- [[buildContentListWhere()]] - code - apps/api/src/services/contentAccess.service.ts
- [[captionAndStoreFigures()]] - code - apps/api/src/services/figure.service.ts
- [[content-shared.ts]] - code - apps/api/src/controllers/content-shared.ts
- [[content.controller.ts_1]] - code - apps/api/src/controllers/content.controller.ts
- [[contentAccess.service.ts]] - code - apps/api/src/services/contentAccess.service.ts
- [[createYoutubeContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[createYoutubeContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[deleteContent()_1]] - code - apps/api/src/controllers/content.controller.ts
- [[deleteContent()_2]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[extractTextFromPageImages()]] - code - apps/api/src/services/pdf.service.ts
- [[formatContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[formatContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[formatTranscriptSegment()]] - code - apps/api/src/controllers/content-shared.ts
- [[getAssignedContentIds()]] - code - apps/api/src/services/contentAccess.service.ts
- [[getContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContentFile()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
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
TABLE source_file, type FROM #community/Content_Controller
SORT file.name ASC
```

## Connections to other communities
- 34 edges to [[_COMMUNITY_Content & Podcast API]]
- 17 edges to [[_COMMUNITY_Env Config & Jobs]]
- 16 edges to [[_COMMUNITY_Billing & Usage API]]
- 13 edges to [[_COMMUNITY_Usage Pricing & Chunk Tools]]
- 11 edges to [[_COMMUNITY_Tenant Admin & Prisma]]
- 9 edges to [[_COMMUNITY_Admin Audit & Auth]]
- 9 edges to [[_COMMUNITY_Community 55]]
- 8 edges to [[_COMMUNITY_Community 65]]
- 7 edges to [[_COMMUNITY_Admin Analytics & Subscriptions]]
- 3 edges to [[_COMMUNITY_Deck Prompt Builder]]
- 2 edges to [[_COMMUNITY_Section & Summary API]]
- 1 edge to [[_COMMUNITY_Community 48]]
- 1 edge to [[_COMMUNITY_Quiz Controller]]

## Top bridge nodes
- [[content.controller.ts_1]] - degree 55, connects to 10 communities
- [[tenant-content.controller.ts]] - degree 49, connects to 10 communities
- [[contentAccess.service.ts]] - degree 27, connects to 8 communities
- [[content-shared.ts]] - degree 18, connects to 4 communities
- [[autoGenerateSectionDecks()]] - degree 9, connects to 4 communities