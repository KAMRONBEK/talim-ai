---
type: community
cohesion: 0.16
members: 16
---

# Assessment Leaderboard

**Cohesion:** 0.16 - loosely connected
**Members:** 16 nodes

## Members
- [[AssessmentAssignment]] - code - packages/types/index.ts
- [[AssessmentLeaderboard]] - code - packages/types/index.ts
- [[AssessmentResults]] - code - packages/types/index.ts
- [[BankQuestionEditableFields]] - code - apps/web/hooks/useAssessments.ts
- [[BankQuestionStatus]] - code - packages/types/index.ts
- [[BankQuestionStyle]] - code - apps/web/hooks/useAssessments.ts
- [[Leaderboard()]] - code - apps/web/app/[locale]/(learner)/learner/assessments/page.tsx
- [[QuestionBank]] - code - packages/types/index.ts
- [[ResultsSection()]] - code - apps/web/app/[locale]/(tenant)/tenant/assessments/page.tsx
- [[TenantAssessment]] - code - packages/types/index.ts
- [[inFlightRefetchInterval()]] - code - apps/web/lib/pushPrimaryInterval.ts
- [[pushPrimaryInterval.ts]] - code - apps/web/lib/pushPrimaryInterval.ts
- [[useAssessmentLeaderboard()]] - code - apps/web/hooks/useAssessments.ts
- [[useAssessmentResults()]] - code - apps/web/hooks/useAssessments.ts
- [[useAssessments.ts]] - code - apps/web/hooks/useAssessments.ts
- [[useLearnerLeaderboard()]] - code - apps/web/hooks/useAssessments.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Assessment_Leaderboard
SORT file.name ASC
```

## Connections to other communities
- 14 edges to [[_COMMUNITY_Tenant Assessments Page]]
- 8 edges to [[_COMMUNITY_Flashcards Page]]
- 7 edges to [[_COMMUNITY_Game Quiz Player]]
- 7 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 5 edges to [[_COMMUNITY_Question Editor Component]]
- 4 edges to [[_COMMUNITY_Learner Dashboard]]
- 2 edges to [[_COMMUNITY_Billing & Profile UI]]
- 1 edge to [[_COMMUNITY_Leaderboard Table Component]]
- 1 edge to [[_COMMUNITY_Quiz Generation Job]]

## Top bridge nodes
- [[useAssessments.ts]] - degree 42, connects to 9 communities
- [[useAssessmentLeaderboard()]] - degree 5, connects to 2 communities
- [[useLearnerLeaderboard()]] - degree 5, connects to 2 communities
- [[ResultsSection()]] - degree 4, connects to 2 communities
- [[Leaderboard()]] - degree 3, connects to 2 communities