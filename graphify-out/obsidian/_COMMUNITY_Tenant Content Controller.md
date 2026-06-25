---
type: community
cohesion: 0.22
members: 21
---

# Tenant Content Controller

**Cohesion:** 0.22 - loosely connected
**Members:** 21 nodes

## Members
- [[assertTenantOwnsContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[createYoutubeContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[deleteContent()_2]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[extractTextFromPageImages()]] - code - apps/api/src/services/pdf.service.ts
- [[extractYoutubeTranscript()]] - code - apps/api/src/services/youtube.service.ts
- [[extractYoutubeVideoId()]] - code - apps/api/src/services/youtube.service.ts
- [[formatContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[formatTranscriptSegment()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContentFile()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContentTranscript()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[listContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[ocrPdfRegion()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[ocrRegionSchema_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[reparseContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[reparseSchema_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[requireTenantId()]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[retryContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[tenant-content.controller.ts]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[uploadContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[youtubeSchema_1]] - code - apps/api/src/controllers/tenant-content.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant_Content_Controller
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_Tutor-Request & Assessment Controllers]]
- 8 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 7 edges to [[_COMMUNITY_Env Config & Background Job Registration]]
- 6 edges to [[_COMMUNITY_YouTube Transcription Service]]
- 5 edges to [[_COMMUNITY_AI Summary Generation]]
- 4 edges to [[_COMMUNITY_Usage Pricing & PDF Extraction]]
- 3 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 3 edges to [[_COMMUNITY_Embedding Inspection Script]]
- 3 edges to [[_COMMUNITY_AI Slide-Deck Prompting]]
- 2 edges to [[_COMMUNITY_API Middleware (authquotarate-limit)]]
- 2 edges to [[_COMMUNITY_Admin Audit & Content Controller]]
- 2 edges to [[_COMMUNITY_Podcast & Progress Controllers]]
- 1 edge to [[_COMMUNITY_Subscription Service]]

## Top bridge nodes
- [[tenant-content.controller.ts]] - degree 48, connects to 13 communities
- [[reparseContent()_1]] - degree 10, connects to 5 communities
- [[extractYoutubeTranscript()]] - degree 10, connects to 3 communities
- [[extractYoutubeVideoId()]] - degree 6, connects to 2 communities
- [[deleteContent()_2]] - degree 5, connects to 2 communities