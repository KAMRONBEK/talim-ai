---
type: community
cohesion: 0.15
members: 26
---

# AI Tutor Chat API

**Cohesion:** 0.15 - loosely connected
**Members:** 26 nodes

## Members
- [[FIGURE_LABEL]] - code - apps/api/src/services/rag.service.ts
- [[boundContextByTokens()]] - code - apps/api/src/services/rag.service.ts
- [[buildContext()]] - code - apps/api/src/services/slides.service.ts
- [[buildFigureContext()]] - code - apps/api/src/services/rag.service.ts
- [[buildRagContext()]] - code - apps/api/src/services/rag.service.ts
- [[chat.controller.ts]] - code - apps/api/src/controllers/chat.controller.ts
- [[chunkText()]] - code - apps/api/src/services/rag.service.ts
- [[countTokens()]] - code - apps/api/src/services/rag.service.ts
- [[getClarificationResponse()]] - code - apps/api/src/lib/tutor-scope.ts
- [[getManimAsset()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getOrCreateSession()]] - code - apps/api/src/controllers/chat.controller.ts
- [[getOutOfScopeResponse()]] - code - apps/api/src/lib/tutor-scope.ts
- [[getRagChunkLabel()]] - code - apps/api/src/lib/locale-prompts.ts
- [[mapChatMessage()]] - code - apps/api/src/controllers/chat.controller.ts
- [[mergeSimilarChunks()]] - code - apps/api/src/services/rag.service.ts
- [[rag.service.ts]] - code - apps/api/src/services/rag.service.ts
- [[rerank()]] - code - apps/api/src/services/rag.service.ts
- [[resolveManimAsset()]] - code - apps/api/src/jobs/renderManim.job.ts
- [[searchSimilarChunks()]] - code - apps/api/src/services/rag.service.ts
- [[searchSimilarFigures()]] - code - apps/api/src/services/rag.service.ts
- [[splitByTokens()]] - code - apps/api/src/services/rag.service.ts
- [[streamChat()]] - code - apps/api/src/controllers/chat.controller.ts
- [[streamSchema]] - code - apps/api/src/controllers/chat.controller.ts
- [[streamStaticAssistantResponse()]] - code - apps/api/src/controllers/chat.controller.ts
- [[toBlocks()]] - code - apps/api/src/services/rag.service.ts
- [[tokenTail()]] - code - apps/api/src/services/rag.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/AI_Tutor_Chat_API
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_Tutor Scope Classifier]]
- 9 edges to [[_COMMUNITY_Config, Pricing & Embeddings]]
- 9 edges to [[_COMMUNITY_Media & Progress Controllers]]
- 7 edges to [[_COMMUNITY_Locale AI Prompts]]
- 6 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 6 edges to [[_COMMUNITY_Tutor Visual Tools]]
- 6 edges to [[_COMMUNITY_Community 95]]
- 5 edges to [[_COMMUNITY_Background Jobs & Queues]]
- 5 edges to [[_COMMUNITY_Slide Deck Prompts]]
- 4 edges to [[_COMMUNITY_Quiz Generation Job]]
- 4 edges to [[_COMMUNITY_Content API Controller]]
- 3 edges to [[_COMMUNITY_Job Registration & Manim]]
- 3 edges to [[_COMMUNITY_Assessment & Tutor-Request Controllers]]
- 3 edges to [[_COMMUNITY_Podcast Generation & Prompts]]
- 2 edges to [[_COMMUNITY_Billing, Usage & Limits]]
- 2 edges to [[_COMMUNITY_Shared Types & Auth Stores]]
- 2 edges to [[_COMMUNITY_Content Grid & Learner Dashboard]]
- 2 edges to [[_COMMUNITY_Assessments Service]]
- 1 edge to [[_COMMUNITY_Fonts & Layout]]
- 1 edge to [[_COMMUNITY_Admin Content & Audit]]
- 1 edge to [[_COMMUNITY_AI Provider Service]]
- 1 edge to [[_COMMUNITY_API Middleware]]
- 1 edge to [[_COMMUNITY_Section Service]]

## Top bridge nodes
- [[chat.controller.ts]] - degree 48, connects to 15 communities
- [[rag.service.ts]] - degree 40, connects to 14 communities
- [[buildRagContext()]] - degree 12, connects to 6 communities
- [[streamChat()]] - degree 16, connects to 4 communities
- [[searchSimilarChunks()]] - degree 8, connects to 4 communities