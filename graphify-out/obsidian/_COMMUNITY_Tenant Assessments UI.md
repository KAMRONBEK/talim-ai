---
type: community
cohesion: 0.16
members: 24
---

# Tenant Assessments UI

**Cohesion:** 0.16 - loosely connected
**Members:** 24 nodes

## Members
- [[AssessmentAssignment]] - code - packages/types/index.ts
- [[AssessmentLeaderboard]] - code - packages/types/index.ts
- [[AssessmentLeaderboardRow]] - code - packages/types/index.ts
- [[AssessmentMode]] - code - packages/types/index.ts
- [[AssessmentResults]] - code - packages/types/index.ts
- [[BankQuestion]] - code - packages/types/index.ts
- [[LeaderboardTable()]] - code - apps/web/components/learner/leaderboard-table.tsx
- [[QuestionBank]] - code - packages/types/index.ts
- [[ResultsSection()]] - code - apps/web/app/[locale]/(tenant)/tenant/assessments/page.tsx
- [[TenantAssessment]] - code - packages/types/index.ts
- [[TenantAssessmentsPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/assessments/page.tsx
- [[leaderboard-table.tsx]] - code - apps/web/components/learner/leaderboard-table.tsx
- [[mutErr()]] - code - apps/web/app/[locale]/(tenant)/tenant/assessments/page.tsx
- [[page.tsx_19]] - code - apps/web/app/[locale]/(tenant)/tenant/assessments/page.tsx
- [[useAssessmentLeaderboard()]] - code - apps/web/hooks/useAssessments.ts
- [[useAssessmentResults()]] - code - apps/web/hooks/useAssessments.ts
- [[useAssessments.ts]] - code - apps/web/hooks/useAssessments.ts
- [[useAssignAssessment()]] - code - apps/web/hooks/useAssessments.ts
- [[useBankQuestions()]] - code - apps/web/hooks/useAssessments.ts
- [[useCreateAssessment()]] - code - apps/web/hooks/useAssessments.ts
- [[useCreateQuestionBank()]] - code - apps/web/hooks/useAssessments.ts
- [[useGenerateBankQuestions()]] - code - apps/web/hooks/useAssessments.ts
- [[usePatchBankQuestion()]] - code - apps/web/hooks/useAssessments.ts
- [[useQuestionBanks()]] - code - apps/web/hooks/useAssessments.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant_Assessments_UI
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 9 edges to [[_COMMUNITY_Learner Assessments UI]]
- 7 edges to [[_COMMUNITY_Tenant Dashboard UI]]
- 2 edges to [[_COMMUNITY_Shared UI Primitives (@talimui)]]
- 2 edges to [[_COMMUNITY_Admin Login & Audit Pages]]
- 1 edge to [[_COMMUNITY_Learner Dashboard UI]]
- 1 edge to [[_COMMUNITY_Admin Generated & Usage UI]]
- 1 edge to [[_COMMUNITY_Tenant Students Management UI]]

## Top bridge nodes
- [[page.tsx_19]] - degree 23, connects to 5 communities
- [[useAssessments.ts]] - degree 29, connects to 4 communities
- [[leaderboard-table.tsx]] - degree 6, connects to 2 communities
- [[TenantAssessmentsPage()]] - degree 11, connects to 1 community
- [[LeaderboardTable()]] - degree 3, connects to 1 community