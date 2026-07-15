---
source_file: "apps/api/src/controllers/chat.controller.ts"
type: "code"
community: "Chat Controller (SSE)"
location: "L1"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/Chat_Controller_SSE
---

# chat.controller.ts

## Connections
- [[AppError]] - `imports` [EXTRACTED]
- [[AppLocale]] - `imports` [EXTRACTED]
- [[AuthenticatedRequest]] - `imports` [EXTRACTED]
- [[StorageService]] - `imports` [EXTRACTED]
- [[ai.service.ts]] - `imports_from` [EXTRACTED]
- [[assertCanAccessContent()]] - `imports` [EXTRACTED]
- [[auth.middleware.ts]] - `imports_from` [EXTRACTED]
- [[buildFigureContext()]] - `imports` [EXTRACTED]
- [[buildRagContext()]] - `imports` [EXTRACTED]
- [[buildTutorSystemMessage()]] - `imports` [EXTRACTED]
- [[chat.routes.ts]] - `imports_from` [EXTRACTED]
- [[classifyTutorScope()]] - `imports` [EXTRACTED]
- [[contentAccess.service.ts]] - `imports_from` [EXTRACTED]
- [[detectTutorGraphIntent()]] - `imports` [EXTRACTED]
- [[error.middleware.ts]] - `imports_from` [EXTRACTED]
- [[getClarificationResponse()]] - `imports` [EXTRACTED]
- [[getContentChat()]] - `contains` [EXTRACTED]
- [[getManimAsset()]] - `contains` [EXTRACTED]
- [[getMessages()]] - `contains` [EXTRACTED]
- [[getOrCreateSession()]] - `contains` [EXTRACTED]
- [[getOutOfScopeResponse()]] - `imports` [EXTRACTED]
- [[getParam()]] - `imports` [EXTRACTED]
- [[index.ts_2]] - `imports_from` [EXTRACTED]
- [[isTutorClarification()]] - `imports` [EXTRACTED]
- [[isTutorScopeRefusal()]] - `imports` [EXTRACTED]
- [[locale-prompts.ts]] - `imports_from` [EXTRACTED]
- [[locale.ts]] - `imports_from` [EXTRACTED]
- [[manimQueue]] - `imports` [EXTRACTED]
- [[mapChatMessage()]] - `contains` [EXTRACTED]
- [[mergeSimilarChunks()]] - `imports` [EXTRACTED]
- [[params.ts]] - `imports_from` [EXTRACTED]
- [[prisma_2]] - `imports` [EXTRACTED]
- [[prisma.ts]] - `imports_from` [EXTRACTED]
- [[queue.service.ts]] - `imports_from` [EXTRACTED]
- [[rag.service.ts]] - `imports_from` [EXTRACTED]
- [[renderManim.job.ts]] - `imports_from` [EXTRACTED]
- [[resolveLocale()]] - `imports` [EXTRACTED]
- [[resolveManimAsset()]] - `imports` [EXTRACTED]
- [[searchSimilarChunks()]] - `imports` [EXTRACTED]
- [[searchSimilarFigures()]] - `imports` [EXTRACTED]
- [[serializeBlockForMessage()]] - `imports` [EXTRACTED]
- [[sse.ts]] - `imports_from` [EXTRACTED]
- [[sseData()]] - `imports` [EXTRACTED]
- [[sseDone()]] - `imports` [EXTRACTED]
- [[sseHeaders()]] - `imports` [EXTRACTED]
- [[storage.service.ts]] - `imports_from` [EXTRACTED]
- [[streamChat()]] - `contains` [EXTRACTED]
- [[streamSchema]] - `contains` [EXTRACTED]
- [[streamStaticAssistantResponse()]] - `contains` [EXTRACTED]
- [[tutor-graph-intent.ts]] - `imports_from` [EXTRACTED]
- [[tutor-scope.ts]] - `imports_from` [EXTRACTED]
- [[tutor-tools.ts]] - `imports_from` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/Chat_Controller_SSE