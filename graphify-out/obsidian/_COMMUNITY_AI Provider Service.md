---
type: community
cohesion: 0.18
members: 17
---

# AI Provider Service

**Cohesion:** 0.18 - loosely connected
**Members:** 17 nodes

## Members
- [[AiUsageContext]] - code - apps/api/src/services/ai.service.ts
- [[ChatMessageContent]] - code - apps/api/src/services/ai.service.ts
- [[ChatMessageInput]] - code - apps/api/src/services/ai.service.ts
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
- [[openai_1]] - code - apps/api/src/services/ai.service.ts
- [[recordCompletionUsage()]] - code - apps/api/src/services/ai.service.ts
- [[toTextOnlyMessages()]] - code - apps/api/src/services/ai.service.ts
- [[withTutorToolInstructions()]] - code - apps/api/src/services/ai.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/AI_Provider_Service
SORT file.name ASC
```

## Connections to other communities
- 5 edges to [[_COMMUNITY_Config, Pricing & Embeddings]]
- 5 edges to [[_COMMUNITY_Tutor Visual Tools]]
- 4 edges to [[_COMMUNITY_Background Jobs & Queues]]
- 2 edges to [[_COMMUNITY_Media & Progress Controllers]]
- 2 edges to [[_COMMUNITY_Podcast Generation & Prompts]]
- 2 edges to [[_COMMUNITY_Quiz Generation Job]]
- 2 edges to [[_COMMUNITY_Tutor Scope Classifier]]
- 2 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 2 edges to [[_COMMUNITY_Section Service]]
- 2 edges to [[_COMMUNITY_Slide Deck Prompts]]
- 1 edge to [[_COMMUNITY_AI Tutor Chat API]]
- 1 edge to [[_COMMUNITY_Locale AI Prompts]]
- 1 edge to [[_COMMUNITY_Shared Types & Auth Stores]]
- 1 edge to [[_COMMUNITY_Chat Message Rendering]]

## Top bridge nodes
- [[ai.service.ts]] - degree 36, connects to 13 communities
- [[generateJsonCompletion()]] - degree 10, connects to 6 communities
- [[generateChatCompletion()]] - degree 6, connects to 3 communities
- [[recordCompletionUsage()]] - degree 4, connects to 1 community
- [[TutorGraphIntent]] - degree 3, connects to 1 community