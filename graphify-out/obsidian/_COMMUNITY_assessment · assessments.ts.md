---
type: community
cohesion: 0.33
members: 7
---

# assessment · assessments.ts

**Cohesion:** 0.33 - loosely connected
**Members:** 7 nodes

## Members
- [[assessments.ts]] - code - apps/api/src/services/assessment/assessments.ts
- [[assignAssessment()_1]] - code - apps/api/src/services/assessment/assessments.ts
- [[assignAssessmentSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[createAssessment()_1]] - code - apps/api/src/services/assessment/assessments.ts
- [[createAssessmentSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[formatAssessment()]] - code - apps/api/src/services/assessment/shared.ts
- [[listAssessments()_1]] - code - apps/api/src/services/assessment/assessments.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/assessment__assessmentsts
SORT file.name ASC
```

## Connections to other communities
- 5 edges to [[_COMMUNITY_assessment · learner.ts]]
- 2 edges to [[_COMMUNITY_subscription]]
- 2 edges to [[_COMMUNITY_controllers admin]]

## Top bridge nodes
- [[assessments.ts]] - degree 12, connects to 3 communities
- [[formatAssessment()]] - degree 3, connects to 1 community
- [[assignAssessmentSchema]] - degree 2, connects to 1 community
- [[createAssessmentSchema]] - degree 2, connects to 1 community