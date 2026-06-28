---
type: community
cohesion: 0.17
members: 20
---

# assessment

**Cohesion:** 0.17 - loosely connected
**Members:** 20 nodes

## Members
- [[QuestionStyle]] - code - apps/api/src/lib/assessment-prompt.ts
- [[assertBank()]] - code - apps/api/src/services/assessment/shared.ts
- [[assertTenantContentIds()]] - code - apps/api/src/services/assessment/shared.ts
- [[assessment-prompt.ts]] - code - apps/api/src/lib/assessment-prompt.ts
- [[banks.ts]] - code - apps/api/src/services/assessment/banks.ts
- [[buildAssessmentPrompt()]] - code - apps/api/src/lib/assessment-prompt.ts
- [[createBank()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[createBankSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[formatBank()]] - code - apps/api/src/services/assessment/shared.ts
- [[formatQuestion()]] - code - apps/api/src/services/assessment/shared.ts
- [[generateQuestions()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[generateSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[getSectionContext()_1]] - code - apps/api/src/services/assessment/shared.ts
- [[isAnswerableMultipleChoice()]] - code - apps/api/src/services/assessment/shared.ts
- [[listBanks()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[listQuestions()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[normalizeQuestionType()]] - code - apps/api/src/lib/assessment-prompt.ts
- [[patchQuestion()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[patchQuestionSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[styleInstruction()]] - code - apps/api/src/lib/assessment-prompt.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/assessment
SORT file.name ASC
```

## Connections to other communities
- 15 edges to [[_COMMUNITY_assessment · learner.ts]]
- 8 edges to [[_COMMUNITY_src lib · GeneratedQuestion]]
- 2 edges to [[_COMMUNITY_src lib · locale-prompts.ts]]
- 2 edges to [[_COMMUNITY_subscription]]
- 2 edges to [[_COMMUNITY_controllers admin]]
- 2 edges to [[_COMMUNITY_src services · TutorGraphIntent]]
- 1 edge to [[_COMMUNITY_src controllers · summary.controller.ts]]

## Top bridge nodes
- [[banks.ts]] - degree 29, connects to 5 communities
- [[generateQuestions()_1]] - degree 8, connects to 2 communities
- [[assessment-prompt.ts]] - degree 7, connects to 2 communities
- [[isAnswerableMultipleChoice()]] - degree 5, connects to 2 communities
- [[getSectionContext()_1]] - degree 4, connects to 2 communities