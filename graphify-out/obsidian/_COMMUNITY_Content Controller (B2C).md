---
type: community
cohesion: 0.16
members: 22
---

# Content Controller (B2C)

**Cohesion:** 0.16 - loosely connected
**Members:** 22 nodes

## Members
- [[AuthPayload]] - code - apps/api/src/middleware/auth.middleware.ts
- [[assertCanMutateContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertIndividualContentRoute()]] - code - apps/api/src/services/contentAccess.service.ts
- [[buildContentListWhere()]] - code - apps/api/src/services/contentAccess.service.ts
- [[content.controller.ts_1]] - code - apps/api/src/controllers/content.controller.ts
- [[contentAccess.service.ts]] - code - apps/api/src/services/contentAccess.service.ts
- [[createYoutubeContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[deleteContent()_1]] - code - apps/api/src/controllers/content.controller.ts
- [[formatContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[formatTranscriptSegment()]] - code - apps/api/src/controllers/content.controller.ts
- [[getAssignedContentIds()]] - code - apps/api/src/services/contentAccess.service.ts
- [[getContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContentFile()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContentTranscript()]] - code - apps/api/src/controllers/content.controller.ts
- [[listContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[ocrPdfRegion()]] - code - apps/api/src/controllers/content.controller.ts
- [[ocrRegionSchema]] - code - apps/api/src/controllers/content.controller.ts
- [[reparseContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[reparseSchema]] - code - apps/api/src/controllers/content.controller.ts
- [[retryContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[uploadContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[youtubeSchema]] - code - apps/api/src/controllers/content.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Content_Controller_B2C
SORT file.name ASC
```

## Connections to other communities
- 18 edges to [[_COMMUNITY_Podcast & Progress Controllers]]
- 9 edges to [[_COMMUNITY_Tutor-Request & Assessment Controllers]]
- 8 edges to [[_COMMUNITY_AI Summary Generation]]
- 8 edges to [[_COMMUNITY_Tenant Content Controller]]
- 6 edges to [[_COMMUNITY_Env Config & Background Job Registration]]
- 6 edges to [[_COMMUNITY_API Middleware (authquotarate-limit)]]
- 6 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 3 edges to [[_COMMUNITY_Admin Audit & Content Controller]]
- 3 edges to [[_COMMUNITY_Embedding Inspection Script]]
- 3 edges to [[_COMMUNITY_Usage Pricing & PDF Extraction]]
- 3 edges to [[_COMMUNITY_AI Slide-Deck Prompting]]
- 1 edge to [[_COMMUNITY_Auth Controller (loginjoinpassword)]]
- 1 edge to [[_COMMUNITY_Chat Controller & Sessions]]
- 1 edge to [[_COMMUNITY_Subscription Service]]
- 1 edge to [[_COMMUNITY_YouTube Transcription Service]]
- 1 edge to [[_COMMUNITY_Quiz Controller & Grading]]

## Top bridge nodes
- [[content.controller.ts_1]] - degree 50, connects to 13 communities
- [[contentAccess.service.ts]] - degree 27, connects to 9 communities
- [[reparseContent()]] - degree 10, connects to 6 communities
- [[deleteContent()_1]] - degree 5, connects to 3 communities
- [[getContentTranscript()]] - degree 4, connects to 3 communities