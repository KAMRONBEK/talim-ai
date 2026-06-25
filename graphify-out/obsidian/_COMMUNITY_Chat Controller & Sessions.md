---
type: community
cohesion: 0.18
members: 17
---

# Chat Controller & Sessions

**Cohesion:** 0.18 - loosely connected
**Members:** 17 nodes

## Members
- [[LocaleLayout()]] - code - apps/web/app/[locale]/layout.tsx
- [[buildFigureContext()]] - code - apps/api/src/services/rag.service.ts
- [[chat.controller.ts]] - code - apps/api/src/controllers/chat.controller.ts
- [[getClarificationResponse()]] - code - apps/api/src/lib/tutor-scope.ts
- [[getManimAsset()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getMessages()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getOrCreateSession()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getOutOfScopeResponse()]] - code - apps/api/src/lib/tutor-scope.ts
- [[mapChatMessage()]] - code - apps/api/src/controllers/chat.controller.ts
- [[mergeSimilarChunks()]] - code - apps/api/src/services/rag.service.ts
- [[rerank()]] - code - apps/api/src/services/rag.service.ts
- [[resolveManimAsset()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[searchSimilarChunks()]] - code - apps/api/src/services/rag.service.ts
- [[searchSimilarFigures()]] - code - apps/api/src/services/rag.service.ts
- [[streamChat()]] - code - apps/api/src/controllers/chat.controller.ts
- [[streamSchema]] - code - apps/api/src/controllers/chat.controller.ts
- [[streamStaticAssistantResponse()]] - code - apps/api/src/controllers/chat.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Chat_Controller__Sessions
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_AI Summary Generation]]
- 6 edges to [[_COMMUNITY_Podcast & Progress Controllers]]
- 6 edges to [[_COMMUNITY_Env Config & Background Job Registration]]
- 6 edges to [[_COMMUNITY_Tutor Scope Classification]]
- 5 edges to [[_COMMUNITY_Tutor Graph Schema & Intent]]
- 4 edges to [[_COMMUNITY_Tutor-Request & Assessment Controllers]]
- 4 edges to [[_COMMUNITY_Embedding Inspection Script]]
- 3 edges to [[_COMMUNITY_Locale-Aware AI Prompts]]
- 3 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 2 edges to [[_COMMUNITY_API Middleware (authquotarate-limit)]]
- 1 edge to [[_COMMUNITY_AI Tutor Visual Tools]]
- 1 edge to [[_COMMUNITY_AI Service (DeepSeektools)]]
- 1 edge to [[_COMMUNITY_Content Controller (B2C)]]
- 1 edge to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 1 edge to [[_COMMUNITY_TTS Normalization Service]]
- 1 edge to [[_COMMUNITY_Quiz Generation Job]]
- 1 edge to [[_COMMUNITY_Auth Guard & App Shell]]

## Top bridge nodes
- [[chat.controller.ts]] - degree 47, connects to 14 communities
- [[streamChat()]] - degree 16, connects to 5 communities
- [[searchSimilarChunks()]] - degree 7, connects to 3 communities
- [[searchSimilarFigures()]] - degree 5, connects to 2 communities
- [[getManimAsset()]] - degree 3, connects to 1 community