---
type: community
cohesion: 0.14
members: 31
---

# Question Bank Service

**Cohesion:** 0.14 - loosely connected
**Members:** 31 nodes

## Members
- [[STRUCTURED_QUESTION_ERROR]] - code - apps/api/src/lib/question-builders.ts
- [[StructuredStorage]] - code - apps/api/src/lib/question-builders.ts
- [[assertBank()]] - code - apps/api/src/services/assessment/shared.ts
- [[assertTenantContentIds()]] - code - apps/api/src/services/assessment/shared.ts
- [[banks.ts]] - code - apps/api/src/services/assessment/banks.ts
- [[buildDragDropQuestion()]] - code - apps/api/src/lib/question-builders.ts
- [[buildDropdownClozeQuestion()]] - code - apps/api/src/lib/question-builders.ts
- [[buildHotspotQuestion()]] - code - apps/api/src/lib/question-builders.ts
- [[buildManualStorage()]] - code - apps/api/src/services/assessment/banks.ts
- [[buildMatchingQuestion()]] - code - apps/api/src/lib/question-builders.ts
- [[buildOrderingQuestion()]] - code - apps/api/src/lib/question-builders.ts
- [[buildStructuredQuestion()]] - code - apps/api/src/lib/question-builders.ts
- [[createBank()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[createBankQuestion()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[createQuestionSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[enqueueGenerateQuestions()]] - code - apps/api/src/services/assessment/banks.ts
- [[formatBank()]] - code - apps/api/src/services/assessment/shared.ts
- [[formatQuestion()]] - code - apps/api/src/services/assessment/shared.ts
- [[generateQuestions()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[generateSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[getSectionContext()]] - code - apps/api/src/services/assessment/shared.ts
- [[isAnswerableMultipleChoice()]] - code - packages/types/grading.ts
- [[isAnswerableMultipleSelect()]] - code - packages/types/grading.ts
- [[jsonStringArray()]] - code - packages/types/grading.ts
- [[listBanks()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[listQuestions()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[patchQuestion()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[patchQuestionSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[question-builders.ts]] - code - apps/api/src/lib/question-builders.ts
- [[sampleChunksEvenly()]] - code - apps/api/src/lib/chunk-sampling.ts
- [[shuffled()]] - code - apps/api/src/lib/question-builders.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Question_Bank_Service
SORT file.name ASC
```

## Connections to other communities
- 15 edges to [[_COMMUNITY_Assessment Service]]
- 13 edges to [[_COMMUNITY_Question Post-processing]]
- 10 edges to [[_COMMUNITY_Quiz Generation Pipeline]]
- 10 edges to [[_COMMUNITY_Answer Grading Engine]]
- 10 edges to [[_COMMUNITY_Quiz Player UI]]
- 5 edges to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 3 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 3 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 2 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 2 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 2 edges to [[_COMMUNITY_Learner Controller]]
- 1 edge to [[_COMMUNITY_AI Tutor Chat Controller]]
- 1 edge to [[_COMMUNITY_Learning Progress & Coverage]]
- 1 edge to [[_COMMUNITY_Section Mastery (Elo-KT)]]

## Top bridge nodes
- [[banks.ts]] - degree 46, connects to 8 communities
- [[jsonStringArray()]] - degree 22, connects to 7 communities
- [[question-builders.ts]] - degree 18, connects to 5 communities
- [[generateQuestions()_1]] - degree 7, connects to 3 communities
- [[sampleChunksEvenly()]] - degree 4, connects to 3 communities