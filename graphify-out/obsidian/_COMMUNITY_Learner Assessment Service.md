---
type: community
cohesion: 0.36
members: 10
---

# Learner Assessment Service

**Cohesion:** 0.36 - loosely connected
**Members:** 10 nodes

## Members
- [[assertLearnerAssignment()]] - code - apps/api/src/services/assessment/shared.ts
- [[computeGamePoints()]] - code - apps/api/src/services/assessment/shared.ts
- [[getAssessmentLeaderboard()]] - code - apps/api/src/services/assessment/results.ts
- [[getLearnerAssessmentLeaderboard()]] - code - apps/api/src/services/assessment/learner.ts
- [[isCorrect()]] - code - apps/api/src/services/assessment/shared.ts
- [[jsonStringArray()]] - code - apps/api/src/services/assessment/shared.ts
- [[learner.ts]] - code - apps/api/src/services/assessment/learner.ts
- [[listLearnerAssessments()_1]] - code - apps/api/src/services/assessment/learner.ts
- [[submitAssessmentSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[submitLearnerAssessment()_1]] - code - apps/api/src/services/assessment/learner.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Learner_Assessment_Service
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_Assessment Service]]
- 4 edges to [[_COMMUNITY_AI Question Banks]]
- 3 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 2 edges to [[_COMMUNITY_AI Summary Generation]]
- 2 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 1 edge to [[_COMMUNITY_Quiz Generation Job]]

## Top bridge nodes
- [[jsonStringArray()]] - degree 12, connects to 4 communities
- [[learner.ts]] - degree 16, connects to 3 communities
- [[isCorrect()]] - degree 5, connects to 1 community
- [[assertLearnerAssignment()]] - degree 4, connects to 1 community
- [[getAssessmentLeaderboard()]] - degree 3, connects to 1 community