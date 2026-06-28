---
type: community
cohesion: 0.26
members: 19
---

# src controllers · sendContentFile()

**Cohesion:** 0.26 - loosely connected
**Members:** 19 nodes

## Members
- [[assertTenantOwnsContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[captionAndStoreFigures()]] - code - apps/api/src/services/figure.service.ts
- [[createYoutubeContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[deleteContent()_2]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[extractRegionTextFromImage()]] - code - apps/api/src/services/pdf.service.ts
- [[extractTextFromPageImages()]] - code - apps/api/src/services/pdf.service.ts
- [[extractYoutubeVideoId()]] - code - apps/api/src/services/youtube.service.ts
- [[formatContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContentFile()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContentTranscript()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[listContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[ocrPdfRegion()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[reparseContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[requireTenantId()]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[retryContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[sendContentFile()]] - code - apps/api/src/controllers/content-shared.ts
- [[tenant-content.controller.ts]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[uploadContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/src_controllers__sendContentFile
SORT file.name ASC
```

## Connections to other communities
- 14 edges to [[_COMMUNITY_src services · env.ts]]
- 11 edges to [[_COMMUNITY_src controllers]]
- 10 edges to [[_COMMUNITY_src controllers · content.controller.ts]]
- 6 edges to [[_COMMUNITY_controllers admin]]
- 6 edges to [[_COMMUNITY_src services · usage-pricing.ts]]
- 5 edges to [[_COMMUNITY_subscription]]
- 5 edges to [[_COMMUNITY_src services]]
- 3 edges to [[_COMMUNITY_src services · slides.controller.ts]]
- 2 edges to [[_COMMUNITY_src routes]]
- 1 edge to [[_COMMUNITY_src jobs]]

## Top bridge nodes
- [[tenant-content.controller.ts]] - degree 49, connects to 10 communities
- [[reparseContent()_1]] - degree 10, connects to 4 communities
- [[captionAndStoreFigures()]] - degree 7, connects to 3 communities
- [[extractRegionTextFromImage()]] - degree 6, connects to 3 communities
- [[sendContentFile()]] - degree 5, connects to 3 communities