---
type: community
cohesion: 0.20
members: 19
---

# Chat Controller (SSE)

**Cohesion:** 0.20 - loosely connected
**Members:** 19 nodes

## Members
- [[buildFigureContext()]] - code - apps/api/src/services/rag.service.ts
- [[chat.controller.ts]] - code - apps/api/src/controllers/chat.controller.ts
- [[getClarificationResponse()]] - code - apps/api/src/lib/tutor-scope.ts
- [[getManimAsset()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getOrCreateSession()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getOutOfScopeResponse()]] - code - apps/api/src/lib/tutor-scope.ts
- [[mapChatMessage()]] - code - apps/api/src/controllers/chat.controller.ts
- [[mergeSimilarChunks()]] - code - apps/api/src/services/rag.service.ts
- [[rerank()]] - code - apps/api/src/services/rag.service.ts
- [[resolveManimAsset()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[searchSimilarChunks()]] - code - apps/api/src/services/rag.service.ts
- [[searchSimilarFigures()]] - code - apps/api/src/services/rag.service.ts
- [[sse.ts]] - code - apps/api/src/lib/sse.ts
- [[sseData()]] - code - apps/api/src/lib/sse.ts
- [[sseDone()]] - code - apps/api/src/lib/sse.ts
- [[sseHeaders()]] - code - apps/api/src/lib/sse.ts
- [[streamChat()]] - code - apps/api/src/controllers/chat.controller.ts
- [[streamSchema]] - code - apps/api/src/controllers/chat.controller.ts
- [[streamStaticAssistantResponse()]] - code - apps/api/src/controllers/chat.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Chat_Controller_SSE
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_Embedding & Chunk Inspection]]
- 9 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 9 edges to [[_COMMUNITY_Summary Controller]]
- 8 edges to [[_COMMUNITY_Tutor Scope Classification]]
- 6 edges to [[_COMMUNITY_Flashcards & Podcast Controllers]]
- 5 edges to [[_COMMUNITY_Tutor Graph Tool]]
- 4 edges to [[_COMMUNITY_Content Controller (YouTubeOCR)]]
- 3 edges to [[_COMMUNITY_Locale Prompts (TutorPodcastSummary)]]
- 2 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 1 edge to [[_COMMUNITY_Root Layout & Fonts]]
- 1 edge to [[_COMMUNITY_Tutor Tools (ChartGeogebraSandbox)]]
- 1 edge to [[_COMMUNITY_Audit & Content Management]]
- 1 edge to [[_COMMUNITY_AI Service (DeepSeek)]]
- 1 edge to [[_COMMUNITY_Admin Content & Subscriptions]]
- 1 edge to [[_COMMUNITY_Flashcards Page]]
- 1 edge to [[_COMMUNITY_Assessment Controller]]
- 1 edge to [[_COMMUNITY_Quiz Generation Job]]

## Top bridge nodes
- [[chat.controller.ts]] - degree 52, connects to 16 communities
- [[streamChat()]] - degree 19, connects to 5 communities
- [[searchSimilarChunks()]] - degree 8, connects to 3 communities
- [[sseData()]] - degree 6, connects to 1 community
- [[sseDone()]] - degree 6, connects to 1 community