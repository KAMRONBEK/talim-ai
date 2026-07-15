---
type: community
cohesion: 0.15
members: 19
---

# AI Service (DeepSeek)

**Cohesion:** 0.15 - loosely connected
**Members:** 19 nodes

## Members
- [[AiUsageContext]] - code - apps/api/src/services/ai.service.ts
- [[ChatMessageContent]] - code - apps/api/src/services/ai.service.ts
- [[ChatMessageInput]] - code - apps/api/src/services/ai.service.ts
- [[DeepSeekThinking]] - code - apps/api/src/services/ai.service.ts
- [[TutorGraphIntent]] - code - apps/api/src/lib/tutor-graph-intent.ts
- [[TutorStreamEvent]] - code - apps/api/src/services/ai.service.ts
- [[TutorToolOptions]] - code - apps/api/src/services/ai.service.ts
- [[ai.service.ts]] - code - apps/api/src/services/ai.service.ts
- [[buildGraphIntentInstruction()]] - code - apps/api/src/services/ai.service.ts
- [[createDeepSeekChatCompletion()]] - code - apps/api/src/services/ai.service.ts
- [[createDeepSeekChatStream()]] - code - apps/api/src/services/ai.service.ts
- [[deepseek]] - code - apps/api/src/services/ai.service.ts
- [[generateChatCompletion()]] - code - apps/api/src/services/ai.service.ts
- [[generateJsonCompletion()]] - code - apps/api/src/services/ai.service.ts
- [[getTutorTools()]] - code - apps/api/src/lib/tutor-tools.ts
- [[openai_1]] - code - apps/api/src/services/ai.service.ts
- [[recordCompletionUsage()]] - code - apps/api/src/services/ai.service.ts
- [[toTextOnlyMessages()]] - code - apps/api/src/services/ai.service.ts
- [[withTutorToolInstructions()]] - code - apps/api/src/services/ai.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/AI_Service_DeepSeek
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 5 edges to [[_COMMUNITY_Embedding & Chunk Inspection]]
- 4 edges to [[_COMMUNITY_Summary Controller]]
- 3 edges to [[_COMMUNITY_Tutor Tools (ChartGeogebraSandbox)]]
- 2 edges to [[_COMMUNITY_Quiz Generation Job]]
- 2 edges to [[_COMMUNITY_Tutor Graph Tool]]
- 2 edges to [[_COMMUNITY_Tutor Scope Classification]]
- 2 edges to [[_COMMUNITY_Quiz Controller]]
- 2 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 1 edge to [[_COMMUNITY_Chat Controller (SSE)]]
- 1 edge to [[_COMMUNITY_Admin Content & Subscriptions]]
- 1 edge to [[_COMMUNITY_Chat Store & Tutor Graph]]

## Top bridge nodes
- [[ai.service.ts]] - degree 38, connects to 12 communities
- [[generateJsonCompletion()]] - degree 11, connects to 6 communities
- [[generateChatCompletion()]] - degree 6, connects to 2 communities
- [[recordCompletionUsage()]] - degree 4, connects to 1 community
- [[TutorGraphIntent]] - degree 3, connects to 1 community