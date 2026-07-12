---
type: community
cohesion: 0.11
members: 45
---

# Content API Controller

**Cohesion:** 0.11 - loosely connected
**Members:** 45 nodes

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
- [[deleteContent()_1]] - code - apps/api/src/controllers/content.controller.ts
- [[deleteContent()_2]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[extractTextFromPageImages()]] - code - apps/api/src/services/pdf.service.ts
- [[filename.ts]] - code - apps/api/src/lib/filename.ts
- [[formatContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[formatContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[formatTranscriptSegment()]] - code - apps/api/src/controllers/content-shared.ts
- [[generateContentSections()]] - code - apps/api/src/services/section.service.ts
- [[getContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContentFile()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContentFile()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getContentTranscript()]] - code - apps/api/src/controllers/content.controller.ts
- [[getContentTranscript()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[getFileLimitsForTenant()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getFileLimitsForUser()]] - code - apps/api/src/services/subscription/user.ts
- [[ingest.service.ts]] - code - apps/api/src/services/ingest.service.ts
- [[ingestText()]] - code - apps/api/src/services/ingest.service.ts
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
- [[storeChunksWithEmbeddings()]] - code - apps/api/src/services/rag.service.ts
- [[tenant-content.controller.ts]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[uploadContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[uploadContent()_1]] - code - apps/api/src/controllers/tenant-content.controller.ts
- [[youtubeSchema]] - code - apps/api/src/controllers/content-shared.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Content_API_Controller
SORT file.name ASC
```

## Connections to other communities
- 18 edges to [[_COMMUNITY_Config, Pricing & Embeddings]]
- 18 edges to [[_COMMUNITY_Assessment & Tutor-Request Controllers]]
- 17 edges to [[_COMMUNITY_Billing, Usage & Limits]]
- 16 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 12 edges to [[_COMMUNITY_Background Jobs & Queues]]
- 9 edges to [[_COMMUNITY_YouTube Transcript Service]]
- 9 edges to [[_COMMUNITY_Media & Progress Controllers]]
- 9 edges to [[_COMMUNITY_PDF & OCR Service]]
- 7 edges to [[_COMMUNITY_Admin Content & Audit]]
- 6 edges to [[_COMMUNITY_Slide Deck Prompts]]
- 4 edges to [[_COMMUNITY_AI Tutor Chat API]]
- 3 edges to [[_COMMUNITY_Section Service]]
- 2 edges to [[_COMMUNITY_API Middleware]]
- 1 edge to [[_COMMUNITY_Learning Coverage & Badges]]

## Top bridge nodes
- [[content.controller.ts_1]] - degree 57, connects to 11 communities
- [[tenant-content.controller.ts]] - degree 51, connects to 10 communities
- [[reparseContent()]] - degree 10, connects to 5 communities
- [[content-shared.ts]] - degree 18, connects to 4 communities
- [[ingest.service.ts]] - degree 12, connects to 4 communities