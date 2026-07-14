---
type: community
cohesion: 0.17
members: 16
---

# AI Provider Service

**Cohesion:** 0.17 - loosely connected
**Members:** 16 nodes

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
- 5 edges to [[_COMMUNITY_Summary Controller]]
- 5 edges to [[_COMMUNITY_AI Tutor Visual Tools]]
- 4 edges to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 4 edges to [[_COMMUNITY_Job Event Fan-out & Media Jobs]]
- 3 edges to [[_COMMUNITY_Usage Pricing & Metering]]
- 2 edges to [[_COMMUNITY_Quiz Generation Pipeline]]
- 2 edges to [[_COMMUNITY_Tutor Scope Classifier]]
- 2 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 2 edges to [[_COMMUNITY_Learning Progress & Coverage]]
- 2 edges to [[_COMMUNITY_Section Controller]]
- 1 edge to [[_COMMUNITY_AI Tutor Chat Controller]]
- 1 edge to [[_COMMUNITY_Podcast Generation & TTS]]
- 1 edge to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 1 edge to [[_COMMUNITY_Tutor Chat Visual Components]]

## Top bridge nodes
- [[ai.service.ts]] - degree 37, connects to 14 communities
- [[generateJsonCompletion()]] - degree 11, connects to 7 communities
- [[recordCompletionUsage()]] - degree 4, connects to 2 communities
- [[createDeepSeekChatCompletion()]] - degree 4, connects to 1 community
- [[TutorGraphIntent]] - degree 3, connects to 1 community