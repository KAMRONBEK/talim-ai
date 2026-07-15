---
type: community
cohesion: 0.15
members: 31
---

# Bank & Question Management

**Cohesion:** 0.15 - loosely connected
**Members:** 31 nodes

## Members
- [[STRUCTURED_QUESTION_ERROR]] - code - apps/api/src/lib/question-builders.ts
- [[StructuredStorage]] - code - apps/api/src/lib/question-builders.ts
- [[acceptedForBlank()]] - code - apps/web/components/quiz/question-inputs.tsx
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
- [[clozeOptions()_1]] - code - apps/web/components/quiz/question-inputs.tsx
- [[createBank()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[createBankQuestion()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[createQuestionSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[enqueueGenerateQuestions()]] - code - apps/api/src/services/assessment/banks.ts
- [[formatBank()]] - code - apps/api/src/services/assessment/shared.ts
- [[formatQuestion()]] - code - apps/api/src/services/assessment/shared.ts
- [[generateQuestions()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[generateSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[getSectionContext()]] - code - apps/api/src/services/assessment/shared.ts
- [[jsonStringArray()]] - code - packages/types/grading.ts
- [[listBanks()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[listQuestions()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[parseQuestionConfig()]] - code - packages/types/grading.ts
- [[patchQuestion()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[patchQuestionSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[question-builders.ts]] - code - apps/api/src/lib/question-builders.ts
- [[shuffled()]] - code - apps/api/src/lib/question-builders.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Bank__Question_Management
SORT file.name ASC
```

## Connections to other communities
- 17 edges to [[_COMMUNITY_Assessment Service]]
- 17 edges to [[_COMMUNITY_Question Postprocessing]]
- 10 edges to [[_COMMUNITY_Answer Grading Logic]]
- 10 edges to [[_COMMUNITY_Quiz Answer Input Components]]
- 9 edges to [[_COMMUNITY_Quiz Generation Job]]
- 7 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 3 edges to [[_COMMUNITY_Quiz Controller]]
- 2 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 2 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 2 edges to [[_COMMUNITY_Flashcards & Podcast Controllers]]
- 1 edge to [[_COMMUNITY_Summary Controller]]
- 1 edge to [[_COMMUNITY_Learning Coverage & Badges]]
- 1 edge to [[_COMMUNITY_Section Mastery Service]]

## Top bridge nodes
- [[banks.ts]] - degree 46, connects to 7 communities
- [[jsonStringArray()]] - degree 23, connects to 7 communities
- [[question-builders.ts]] - degree 18, connects to 4 communities
- [[parseQuestionConfig()]] - degree 18, connects to 4 communities
- [[generateQuestions()_1]] - degree 7, connects to 3 communities