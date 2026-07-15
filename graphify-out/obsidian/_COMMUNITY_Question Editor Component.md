---
type: community
cohesion: 0.18
members: 14
---

# Question Editor Component

**Cohesion:** 0.18 - loosely connected
**Members:** 14 nodes

## Members
- [[BankQuestion]] - code - packages/types/index.ts
- [[CHOICE_TYPES]] - code - apps/web/components/tenant/question-editor.tsx
- [[QUESTION_TYPES]] - code - apps/web/components/tenant/question-editor.tsx
- [[QUESTION_TYPE_LABEL_KEYS]] - code - apps/web/components/tenant/question-editor.tsx
- [[QuestionBody]] - code - apps/web/components/tenant/question-editor.tsx
- [[QuestionEditor()]] - code - apps/web/components/tenant/question-editor.tsx
- [[QuestionType]] - code - packages/types/index.ts
- [[SIMPLE_ANSWER_TYPES]] - code - apps/web/components/tenant/question-editor.tsx
- [[StringListField()]] - code - apps/web/components/tenant/question-editor.tsx
- [[asStringArray()]] - code - apps/web/components/tenant/question-editor.tsx
- [[mutErr()_1]] - code - apps/web/components/tenant/question-editor.tsx
- [[question-editor.tsx]] - code - apps/web/components/tenant/question-editor.tsx
- [[useCreateBankQuestion()]] - code - apps/web/hooks/useAssessments.ts
- [[usePatchBankQuestion()]] - code - apps/web/hooks/useAssessments.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Question_Editor_Component
SORT file.name ASC
```

## Connections to other communities
- 7 edges to [[_COMMUNITY_Tenant Assessments Page]]
- 7 edges to [[_COMMUNITY_Login & Assign Content]]
- 5 edges to [[_COMMUNITY_Assessment Leaderboard]]
- 3 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 1 edge to [[_COMMUNITY_Quiz Answer Input Components]]
- 1 edge to [[_COMMUNITY_Billing & Profile UI]]
- 1 edge to [[_COMMUNITY_Become Tutor & Auth Shell]]
- 1 edge to [[_COMMUNITY_Learner Dashboard]]
- 1 edge to [[_COMMUNITY_Quiz Page & Hooks]]
- 1 edge to [[_COMMUNITY_Answer Grading Logic]]

## Top bridge nodes
- [[QuestionType]] - degree 8, connects to 7 communities
- [[question-editor.tsx]] - degree 24, connects to 6 communities
- [[BankQuestion]] - degree 4, connects to 3 communities
- [[QuestionEditor()]] - degree 6, connects to 2 communities
- [[usePatchBankQuestion()]] - degree 5, connects to 2 communities