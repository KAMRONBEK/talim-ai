---
type: community
cohesion: 0.08
members: 67
---

# Assessment Controller

**Cohesion:** 0.08 - loosely connected
**Members:** 67 nodes

## Members
- [[admin-rate-limit.middleware.ts]] - code - apps/api/src/middleware/admin-rate-limit.middleware.ts
- [[admin.routes.ts]] - code - apps/api/src/routes/admin.routes.ts
- [[adminRateLimit()]] - code - apps/api/src/middleware/admin-rate-limit.middleware.ts
- [[adminRoutes]] - code - apps/api/src/routes/admin.routes.ts
- [[answerCheckRateLimit]] - code - apps/api/src/middleware/rate-limit.middleware.ts
- [[assessment.controller.ts]] - code - apps/api/src/controllers/assessment.controller.ts
- [[assessmentLeaderboard()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[assessmentResults()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[assignAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[asyncHandler()]] - code - apps/api/src/lib/asyncHandler.ts
- [[asyncHandler.ts]] - code - apps/api/src/lib/asyncHandler.ts
- [[attachTenantId()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[auth.routes.ts]] - code - apps/api/src/routes/auth.routes.ts
- [[authMiddleware()]] - code - apps/api/src/middleware/auth.middleware.ts
- [[authRoutes]] - code - apps/api/src/routes/auth.routes.ts
- [[authWriteRateLimit]] - code - apps/api/src/middleware/rate-limit.middleware.ts
- [[billing.routes.ts]] - code - apps/api/src/routes/billing.routes.ts
- [[billingRoutes]] - code - apps/api/src/routes/billing.routes.ts
- [[blockIndividualContentForOwner()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[blockLearnerMutations()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[buckets]] - code - apps/api/src/middleware/admin-rate-limit.middleware.ts
- [[chat.routes.ts]] - code - apps/api/src/routes/chat.routes.ts
- [[chatRoutes]] - code - apps/api/src/routes/chat.routes.ts
- [[content.routes.ts]] - code - apps/api/src/routes/content.routes.ts
- [[contentRoutes]] - code - apps/api/src/routes/content.routes.ts
- [[createAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[createBank()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[createBankQuestion()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[enforceQuota()]] - code - apps/api/src/middleware/quota.middleware.ts
- [[events.routes.ts]] - code - apps/api/src/routes/events.routes.ts
- [[eventsRoutes]] - code - apps/api/src/routes/events.routes.ts
- [[generateQuestions()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[goLiveAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[index.ts_1]] - code - apps/api/src/routes/index.ts
- [[learner.routes.ts]] - code - apps/api/src/routes/learner.routes.ts
- [[learnerAssessmentLeaderboard()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[learnerRoutes]] - code - apps/api/src/routes/learner.routes.ts
- [[listAssessments()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[listBanks()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[listLearnerAssessments()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[listQuestions()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[loginRateLimit]] - code - apps/api/src/middleware/rate-limit.middleware.ts
- [[patchQuestion()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[quiz.routes.ts]] - code - apps/api/src/routes/quiz.routes.ts
- [[quizRoutes]] - code - apps/api/src/routes/quiz.routes.ts
- [[quota.middleware.ts]] - code - apps/api/src/middleware/quota.middleware.ts
- [[rate-limit.middleware.ts]] - code - apps/api/src/middleware/rate-limit.middleware.ts
- [[reparseRateLimit]] - code - apps/api/src/middleware/rate-limit.middleware.ts
- [[requireActiveLearner()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[requireRole()]] - code - apps/api/src/middleware/auth.middleware.ts
- [[requireTenant()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[requireTenantId()_1]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[requireTenantMember()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[requireTenantOwner()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[routes]] - code - apps/api/src/routes/index.ts
- [[scheduleAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[streamEvents()]] - code - apps/api/src/controllers/events.controller.ts
- [[submitLearnerAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[summary.routes.ts]] - code - apps/api/src/routes/summary.routes.ts
- [[summaryRoutes]] - code - apps/api/src/routes/summary.routes.ts
- [[tenant.middleware.ts]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[tenant.routes.ts]] - code - apps/api/src/routes/tenant.routes.ts
- [[tenantContent]] - code - apps/api/src/routes/tenant.routes.ts
- [[tenantRoutes]] - code - apps/api/src/routes/tenant.routes.ts
- [[upload]] - code - apps/api/src/middleware/upload.middleware.ts
- [[usage.routes.ts]] - code - apps/api/src/routes/usage.routes.ts
- [[usageRoutes]] - code - apps/api/src/routes/usage.routes.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Assessment_Controller
SORT file.name ASC
```

## Connections to other communities
- 25 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 16 edges to [[_COMMUNITY_Content Controller (YouTubeOCR)]]
- 12 edges to [[_COMMUNITY_Flashcards & Podcast Controllers]]
- 9 edges to [[_COMMUNITY_Audit & Content Management]]
- 9 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 4 edges to [[_COMMUNITY_Auth Controller]]
- 2 edges to [[_COMMUNITY_Job Event Bus]]
- 1 edge to [[_COMMUNITY_Assessment Service]]
- 1 edge to [[_COMMUNITY_Chat Controller (SSE)]]
- 1 edge to [[_COMMUNITY_Learner API Controller]]
- 1 edge to [[_COMMUNITY_Quiz Controller]]
- 1 edge to [[_COMMUNITY_Summary Controller]]
- 1 edge to [[_COMMUNITY_Tenant Student Management]]
- 1 edge to [[_COMMUNITY_Admin Content & Subscriptions]]
- 1 edge to [[_COMMUNITY_Quota Limit Errors]]

## Top bridge nodes
- [[assessment.controller.ts]] - degree 26, connects to 5 communities
- [[tenant.middleware.ts]] - degree 23, connects to 5 communities
- [[quota.middleware.ts]] - degree 14, connects to 5 communities
- [[tenant.routes.ts]] - degree 26, connects to 4 communities
- [[content.routes.ts]] - degree 23, connects to 3 communities