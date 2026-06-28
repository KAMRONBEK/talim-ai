---
type: community
cohesion: 0.27
members: 12
---

# src controllers · chat.controller.ts

**Cohesion:** 0.27 - loosely connected
**Members:** 12 nodes

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
- [[streamChat()]] - code - apps/api/src/controllers/chat.controller.ts
- [[streamSchema]] - code - apps/api/src/controllers/chat.controller.ts
- [[streamStaticAssistantResponse()]] - code - apps/api/src/controllers/chat.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/src_controllers__chatcontrollerts
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_src controllers]]
- 7 edges to [[_COMMUNITY_src services]]
- 6 edges to [[_COMMUNITY_src lib · tutor-scope.ts]]
- 5 edges to [[_COMMUNITY_src lib · tutor-graph-intent.ts]]
- 4 edges to [[_COMMUNITY_src jobs]]
- 3 edges to [[_COMMUNITY_src lib · locale-prompts.ts]]
- 3 edges to [[_COMMUNITY_controllers admin]]
- 2 edges to [[_COMMUNITY_subscription]]
- 2 edges to [[_COMMUNITY_src routes]]
- 2 edges to [[_COMMUNITY_src controllers · summary.controller.ts]]
- 2 edges to [[_COMMUNITY_src services · env.ts]]
- 1 edge to [[_COMMUNITY_i18n]]
- 1 edge to [[_COMMUNITY_src lib]]
- 1 edge to [[_COMMUNITY_src services · TutorGraphIntent]]
- 1 edge to [[_COMMUNITY_src controllers · content.controller.ts]]
- 1 edge to [[_COMMUNITY_packages types]]
- 1 edge to [[_COMMUNITY_packages types · api.ts]]

## Top bridge nodes
- [[chat.controller.ts]] - degree 47, connects to 17 communities
- [[streamChat()]] - degree 16, connects to 6 communities
- [[getManimAsset()]] - degree 3, connects to 1 community
- [[resolveManimAsset()]] - degree 3, connects to 1 community
- [[getClarificationResponse()]] - degree 3, connects to 1 community