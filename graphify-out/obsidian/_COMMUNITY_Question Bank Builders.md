---
type: community
cohesion: 0.17
members: 22
---

# Question Bank Builders

**Cohesion:** 0.17 - loosely connected
**Members:** 22 nodes

## Members
- [[STRUCTURED_QUESTION_ERROR]] - code - apps/api/src/lib/question-builders.ts
- [[StructuredStorage]] - code - apps/api/src/lib/question-builders.ts
- [[assertBank()]] - code - apps/api/src/services/assessment/shared.ts
- [[assertTenantContentIds()]] - code - apps/api/src/services/assessment/shared.ts
- [[banks.ts]] - code - apps/api/src/services/assessment/banks.ts
- [[buildDragDropQuestion()]] - code - apps/api/src/lib/question-builders.ts
- [[buildHotspotQuestion()]] - code - apps/api/src/lib/question-builders.ts
- [[buildManualStorage()]] - code - apps/api/src/services/assessment/banks.ts
- [[createBank()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[createBankSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[createQuestionSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[enqueueGenerateQuestions()]] - code - apps/api/src/services/assessment/banks.ts
- [[formatBank()]] - code - apps/api/src/services/assessment/shared.ts
- [[generateSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[isAnswerableMultipleChoice()]] - code - packages/types/grading.ts
- [[isAnswerableMultipleSelect()]] - code - packages/types/grading.ts
- [[listBanks()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[listQuestions()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[parseHotspotRegions()]] - code - packages/types/grading.ts
- [[patchQuestion()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[patchQuestionSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[question-builders.ts]] - code - apps/api/src/lib/question-builders.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Question_Bank_Builders
SORT file.name ASC
```

## Connections to other communities
- 19 edges to [[_COMMUNITY_Grading Engine]]
- 11 edges to [[_COMMUNITY_Assessment Services]]
- 11 edges to [[_COMMUNITY_Question Postprocessing]]
- 9 edges to [[_COMMUNITY_Question Generation Pipeline]]
- 6 edges to [[_COMMUNITY_Bull Jobs & Queues]]
- 2 edges to [[_COMMUNITY_Shared Types & Locale]]
- 2 edges to [[_COMMUNITY_Subscriptions & Quota]]
- 1 edge to [[_COMMUNITY_Admin API Controllers]]

## Top bridge nodes
- [[banks.ts]] - degree 46, connects to 8 communities
- [[question-builders.ts]] - degree 18, connects to 4 communities
- [[assertBank()]] - degree 7, connects to 3 communities
- [[buildManualStorage()]] - degree 8, connects to 2 communities
- [[isAnswerableMultipleChoice()]] - degree 6, connects to 2 communities