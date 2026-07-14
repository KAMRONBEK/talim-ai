---
type: community
cohesion: 0.13
members: 33
---

# AI Tutor Chat Controller

**Cohesion:** 0.13 - loosely connected
**Members:** 33 nodes

## Members
- [[FIGURE_LABEL]] - code - apps/api/src/services/rag.service.ts
- [[buildFigureContext()]] - code - apps/api/src/services/rag.service.ts
- [[buildRagContext()]] - code - apps/api/src/services/rag.service.ts
- [[chat.controller.ts]] - code - apps/api/src/controllers/chat.controller.ts
- [[chunkText()]] - code - apps/api/src/services/rag.service.ts
- [[countTokens()]] - code - apps/api/src/services/rag.service.ts
- [[embeddingToSql()]] - code - apps/api/src/services/embed.service.ts
- [[generateContentSections()]] - code - apps/api/src/services/section.service.ts
- [[getClarificationResponse()]] - code - apps/api/src/lib/tutor-scope.ts
- [[getManimAsset()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getOrCreateSession()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getOutOfScopeResponse()]] - code - apps/api/src/lib/tutor-scope.ts
- [[getRagChunkLabel()]] - code - apps/api/src/lib/locale-prompts.ts
- [[ingest.service.ts]] - code - apps/api/src/services/ingest.service.ts
- [[ingestText()]] - code - apps/api/src/services/ingest.service.ts
- [[mapChatMessage()]] - code - apps/api/src/controllers/chat.controller.ts
- [[mergeSimilarChunks()]] - code - apps/api/src/services/rag.service.ts
- [[rag.service.ts]] - code - apps/api/src/services/rag.service.ts
- [[rerank()]] - code - apps/api/src/services/rag.service.ts
- [[resolveManimAsset()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[searchSimilarChunks()]] - code - apps/api/src/services/rag.service.ts
- [[searchSimilarFigures()]] - code - apps/api/src/services/rag.service.ts
- [[splitByTokens()]] - code - apps/api/src/services/rag.service.ts
- [[sse.ts]] - code - apps/api/src/lib/sse.ts
- [[sseData()]] - code - apps/api/src/lib/sse.ts
- [[sseDone()]] - code - apps/api/src/lib/sse.ts
- [[sseHeaders()]] - code - apps/api/src/lib/sse.ts
- [[storeChunksWithEmbeddings()]] - code - apps/api/src/services/rag.service.ts
- [[streamChat()]] - code - apps/api/src/controllers/chat.controller.ts
- [[streamSchema]] - code - apps/api/src/controllers/chat.controller.ts
- [[streamStaticAssistantResponse()]] - code - apps/api/src/controllers/chat.controller.ts
- [[toBlocks()]] - code - apps/api/src/services/rag.service.ts
- [[tokenTail()]] - code - apps/api/src/services/rag.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/AI_Tutor_Chat_Controller
SORT file.name ASC
```

## Connections to other communities
- 17 edges to [[_COMMUNITY_Usage Pricing & Metering]]
- 14 edges to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 10 edges to [[_COMMUNITY_Tutor Scope Classifier]]
- 9 edges to [[_COMMUNITY_Summary Controller]]
- 7 edges to [[_COMMUNITY_Content Media Controllers]]
- 7 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 6 edges to [[_COMMUNITY_AI Prompt Builders]]
- 6 edges to [[_COMMUNITY_AI Tutor Visual Tools]]
- 4 edges to [[_COMMUNITY_Job Event Fan-out & Media Jobs]]
- 3 edges to [[_COMMUNITY_Quiz Generation Pipeline]]
- 3 edges to [[_COMMUNITY_Section Controller]]
- 2 edges to [[_COMMUNITY_Assessment Controller]]
- 2 edges to [[_COMMUNITY_API Routes & Middleware]]
- 2 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 2 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 2 edges to [[_COMMUNITY_Flashcards UI]]
- 2 edges to [[_COMMUNITY_Podcast Generation & TTS]]
- 2 edges to [[_COMMUNITY_Assessment Service]]
- 1 edge to [[_COMMUNITY_Fonts & Root Layout]]
- 1 edge to [[_COMMUNITY_Admin Content & Audit Controllers]]
- 1 edge to [[_COMMUNITY_AI Provider Service]]
- 1 edge to [[_COMMUNITY_Question Bank Service]]

## Top bridge nodes
- [[chat.controller.ts]] - degree 52, connects to 14 communities
- [[rag.service.ts]] - degree 40, connects to 12 communities
- [[buildRagContext()]] - degree 12, connects to 7 communities
- [[streamChat()]] - degree 19, connects to 4 communities
- [[ingest.service.ts]] - degree 11, connects to 4 communities