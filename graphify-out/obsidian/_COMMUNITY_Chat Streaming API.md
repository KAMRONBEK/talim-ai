---
type: community
cohesion: 0.26
members: 13
---

# Chat Streaming API

**Cohesion:** 0.26 - loosely connected
**Members:** 13 nodes

## Members
- [[buildFigureContext()]] - code - apps/api/src/services/rag.service.ts
- [[chat.controller.ts]] - code - apps/api/src/controllers/chat.controller.ts
- [[getClarificationResponse()]] - code - apps/api/src/lib/tutor-scope.ts
- [[getManimAsset()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getOrCreateSession()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getOutOfScopeResponse()]] - code - apps/api/src/lib/tutor-scope.ts
- [[mapChatMessage()]] - code - apps/api/src/controllers/chat.controller.ts
- [[mergeSimilarChunks()]] - code - apps/api/src/services/rag.service.ts
- [[resolveManimAsset()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[searchSimilarFigures()]] - code - apps/api/src/services/rag.service.ts
- [[streamChat()]] - code - apps/api/src/controllers/chat.controller.ts
- [[streamSchema]] - code - apps/api/src/controllers/chat.controller.ts
- [[streamStaticAssistantResponse()]] - code - apps/api/src/controllers/chat.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Chat_Streaming_API
SORT file.name ASC
```

## Connections to other communities
- 11 edges to [[_COMMUNITY_Content Access & Media API]]
- 8 edges to [[_COMMUNITY_Bull Jobs & Queues]]
- 8 edges to [[_COMMUNITY_RAG Retrieval]]
- 7 edges to [[_COMMUNITY_Tutor Scope Classifier]]
- 6 edges to [[_COMMUNITY_Tutor Visual Tools]]
- 3 edges to [[_COMMUNITY_AI Prompt Builders]]
- 2 edges to [[_COMMUNITY_API Routing & Middleware]]
- 2 edges to [[_COMMUNITY_Subscriptions & Quota]]
- 2 edges to [[_COMMUNITY_Embeddings Service]]
- 1 edge to [[_COMMUNITY_Locale Routing]]
- 1 edge to [[_COMMUNITY_AI Summary & Ingest]]
- 1 edge to [[_COMMUNITY_Shared Types & Locale]]
- 1 edge to [[_COMMUNITY_Content Stage & Limits]]

## Top bridge nodes
- [[chat.controller.ts]] - degree 48, connects to 12 communities
- [[streamChat()]] - degree 16, connects to 5 communities
- [[searchSimilarFigures()]] - degree 5, connects to 2 communities
- [[getManimAsset()]] - degree 3, connects to 1 community
- [[resolveManimAsset()]] - degree 3, connects to 1 community