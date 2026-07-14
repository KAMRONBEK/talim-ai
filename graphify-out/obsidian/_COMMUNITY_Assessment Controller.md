---
type: community
cohesion: 0.26
members: 19
---

# Assessment Controller

**Cohesion:** 0.26 - loosely connected
**Members:** 19 nodes

## Members
- [[assessment.controller.ts]] - code - apps/api/src/controllers/assessment.controller.ts
- [[assessmentLeaderboard()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[assessmentResults()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[assignAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[createAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[createBank()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[createBankQuestion()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[generateQuestions()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[getParam()]] - code - apps/api/src/lib/params.ts
- [[goLiveAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[learnerAssessmentLeaderboard()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[listAssessments()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[listBanks()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[listLearnerAssessments()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[listQuestions()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[patchQuestion()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[requireTenant()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[scheduleAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[submitLearnerAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Assessment_Controller
SORT file.name ASC
```

## Connections to other communities
- 26 edges to [[_COMMUNITY_Content Media Controllers]]
- 17 edges to [[_COMMUNITY_Admin Content & Audit Controllers]]
- 15 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 11 edges to [[_COMMUNITY_Learner Controller]]
- 8 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 4 edges to [[_COMMUNITY_Summary Controller]]
- 3 edges to [[_COMMUNITY_API Routes & Middleware]]
- 3 edges to [[_COMMUNITY_Section Controller]]
- 2 edges to [[_COMMUNITY_Subscription & Billing Service]]
- 2 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 2 edges to [[_COMMUNITY_AI Tutor Chat Controller]]
- 1 edge to [[_COMMUNITY_Tenant Org & Roles Service]]
- 1 edge to [[_COMMUNITY_Assessment Service]]
- 1 edge to [[_COMMUNITY_Fonts & Root Layout]]
- 1 edge to [[_COMMUNITY_Section Mastery (Elo-KT)]]

## Top bridge nodes
- [[getParam()]] - degree 101, connects to 12 communities
- [[assessment.controller.ts]] - degree 26, connects to 5 communities