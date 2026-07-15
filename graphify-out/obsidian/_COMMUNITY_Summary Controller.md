---
type: community
cohesion: 0.25
members: 19
---

# Summary Controller

**Cohesion:** 0.25 - loosely connected
**Members:** 19 nodes

## Members
- [[boundContextByTokens()]] - code - apps/api/src/services/rag.service.ts
- [[buildContext()]] - code - apps/api/src/services/slides.service.ts
- [[buildRagContext()]] - code - apps/api/src/services/rag.service.ts
- [[buildSummaryMessages()]] - code - apps/api/src/controllers/summary.controller.ts
- [[buildSummaryUserPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[formatSummary()]] - code - apps/api/src/controllers/summary.controller.ts
- [[generateSummary()]] - code - apps/api/src/controllers/summary.controller.ts
- [[generateSummaryText()]] - code - apps/api/src/controllers/summary.controller.ts
- [[getOrderedChunks()]] - code - apps/api/src/services/rag.service.ts
- [[getSectionBody()]] - code - apps/api/src/services/section.service.ts
- [[getSummary()_1]] - code - apps/api/src/controllers/summary.controller.ts
- [[getSummarySystemPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[persistAndRecordSummary()]] - code - apps/api/src/controllers/summary.controller.ts
- [[sanitizeSummaryOutput()]] - code - apps/api/src/lib/locale-prompts.ts
- [[scopeKey()_1]] - code - apps/api/src/controllers/summary.controller.ts
- [[streamSummary()]] - code - apps/api/src/controllers/summary.controller.ts
- [[summary.controller.ts]] - code - apps/api/src/controllers/summary.controller.ts
- [[summaryBodySchema]] - code - apps/api/src/controllers/summary.controller.ts
- [[summaryUserId()]] - code - apps/api/src/controllers/summary.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Summary_Controller
SORT file.name ASC
```

## Connections to other communities
- 14 edges to [[_COMMUNITY_Flashcards & Podcast Controllers]]
- 11 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 9 edges to [[_COMMUNITY_Chat Controller (SSE)]]
- 8 edges to [[_COMMUNITY_Embedding & Chunk Inspection]]
- 6 edges to [[_COMMUNITY_Content Controller (YouTubeOCR)]]
- 6 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 5 edges to [[_COMMUNITY_Locale Prompts (TutorPodcastSummary)]]
- 5 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 4 edges to [[_COMMUNITY_AI Service (DeepSeek)]]
- 1 edge to [[_COMMUNITY_Audit & Content Management]]
- 1 edge to [[_COMMUNITY_Admin Content & Subscriptions]]
- 1 edge to [[_COMMUNITY_Flashcards Page]]
- 1 edge to [[_COMMUNITY_Assessment Controller]]
- 1 edge to [[_COMMUNITY_Quiz Generation Job]]
- 1 edge to [[_COMMUNITY_Assessment Service]]
- 1 edge to [[_COMMUNITY_Bank & Question Management]]

## Top bridge nodes
- [[summary.controller.ts]] - degree 47, connects to 13 communities
- [[buildRagContext()]] - degree 12, connects to 7 communities
- [[streamSummary()]] - degree 15, connects to 4 communities
- [[getSectionBody()]] - degree 9, connects to 4 communities
- [[generateSummary()]] - degree 11, connects to 3 communities