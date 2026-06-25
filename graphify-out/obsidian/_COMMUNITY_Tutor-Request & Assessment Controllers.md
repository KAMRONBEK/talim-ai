---
type: community
cohesion: 0.20
members: 22
---

# Tutor-Request & Assessment Controllers

**Cohesion:** 0.20 - loosely connected
**Members:** 22 nodes

## Members
- [[admin-tutor-request.controller.ts]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[approveTutorRequest()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[assessment.controller.ts]] - code - apps/api/src/controllers/assessment.controller.ts
- [[assessmentLeaderboard()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[assessmentResults()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[assignAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[createAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[createBank()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[generateQuestions()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[getParam()]] - code - apps/api/src/lib/params.ts
- [[learnerAssessmentLeaderboard()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[listAssessments()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[listBanks()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[listLearnerAssessments()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[listQuestions()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[listSchema]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[listTutorRequests()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[params.ts]] - code - apps/api/src/lib/params.ts
- [[patchQuestion()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[rejectTutorRequest()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[requireTenant()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[submitLearnerAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tutor-Request__Assessment_Controllers
SORT file.name ASC
```

## Connections to other communities
- 24 edges to [[_COMMUNITY_Podcast & Progress Controllers]]
- 15 edges to [[_COMMUNITY_Admin Audit & Content Controller]]
- 10 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 9 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 9 edges to [[_COMMUNITY_Tenant Content Controller]]
- 7 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 7 edges to [[_COMMUNITY_Tenant Controller (studentsprogress)]]
- 5 edges to [[_COMMUNITY_API Middleware (authquotarate-limit)]]
- 5 edges to [[_COMMUNITY_Admin Tenants Controller]]
- 4 edges to [[_COMMUNITY_Chat Controller & Sessions]]
- 2 edges to [[_COMMUNITY_AI Summary Generation]]
- 1 edge to [[_COMMUNITY_Auth Controller (loginjoinpassword)]]
- 1 edge to [[_COMMUNITY_Assessment Service]]

## Top bridge nodes
- [[getParam()]] - degree 81, connects to 10 communities
- [[params.ts]] - degree 17, connects to 10 communities
- [[admin-tutor-request.controller.ts]] - degree 14, connects to 4 communities
- [[assessment.controller.ts]] - degree 23, connects to 3 communities
- [[approveTutorRequest()]] - degree 3, connects to 1 community