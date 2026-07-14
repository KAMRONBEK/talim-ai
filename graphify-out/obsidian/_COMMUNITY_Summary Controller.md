---
type: community
cohesion: 0.39
members: 12
---

# Summary Controller

**Cohesion:** 0.39 - loosely connected
**Members:** 12 nodes

## Members
- [[formatSummary()]] - code - apps/api/src/controllers/summary.controller.ts
- [[generateChatCompletion()]] - code - apps/api/src/services/ai.service.ts
- [[generateSummary()]] - code - apps/api/src/controllers/summary.controller.ts
- [[generateSummaryText()]] - code - apps/api/src/controllers/summary.controller.ts
- [[getSummary()_1]] - code - apps/api/src/controllers/summary.controller.ts
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
- 16 edges to [[_COMMUNITY_Content Media Controllers]]
- 9 edges to [[_COMMUNITY_AI Tutor Chat Controller]]
- 7 edges to [[_COMMUNITY_AI Prompt Builders]]
- 5 edges to [[_COMMUNITY_AI Provider Service]]
- 4 edges to [[_COMMUNITY_Assessment Controller]]
- 3 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 3 edges to [[_COMMUNITY_Learning Progress & Coverage]]
- 2 edges to [[_COMMUNITY_API Routes & Middleware]]
- 2 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 2 edges to [[_COMMUNITY_Section Controller]]
- 1 edge to [[_COMMUNITY_Admin Content & Audit Controllers]]
- 1 edge to [[_COMMUNITY_Job Event Fan-out & Media Jobs]]
- 1 edge to [[_COMMUNITY_Usage Pricing & Metering]]
- 1 edge to [[_COMMUNITY_Subscription & Billing Service]]
- 1 edge to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 1 edge to [[_COMMUNITY_Flashcards UI]]
- 1 edge to [[_COMMUNITY_Podcast Generation & TTS]]

## Top bridge nodes
- [[summary.controller.ts]] - degree 47, connects to 16 communities
- [[streamSummary()]] - degree 15, connects to 4 communities
- [[generateSummary()]] - degree 11, connects to 2 communities
- [[getSummary()_1]] - degree 7, connects to 2 communities
- [[generateChatCompletion()]] - degree 6, connects to 2 communities