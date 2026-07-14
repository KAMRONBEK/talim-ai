---
type: community
cohesion: 0.06
members: 85
---

# API Routing & Middleware

**Cohesion:** 0.06 - loosely connected
**Members:** 85 nodes

## Members
- [[admin-audit.controller.ts]] - code - apps/api/src/controllers/admin-audit.controller.ts
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
- [[auth.middleware.ts]] - code - apps/api/src/middleware/auth.middleware.ts
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
- [[events.controller.ts]] - code - apps/api/src/controllers/events.controller.ts
- [[events.routes.ts]] - code - apps/api/src/routes/events.routes.ts
- [[eventsRoutes]] - code - apps/api/src/routes/events.routes.ts
- [[generateQuestions()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[getMaterials()]] - code - apps/api/src/controllers/learner.controller.ts
- [[getProgress()]] - code - apps/api/src/controllers/learner.controller.ts
- [[getSummary()]] - code - apps/api/src/controllers/learner.controller.ts
- [[goLiveAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[index.ts_1]] - code - apps/api/src/routes/index.ts
- [[learner.controller.ts]] - code - apps/api/src/controllers/learner.controller.ts
- [[learner.routes.ts]] - code - apps/api/src/routes/learner.routes.ts
- [[learnerAssessmentLeaderboard()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[learnerRoutes]] - code - apps/api/src/routes/learner.routes.ts
- [[listAdminAuditLogs()]] - code - apps/api/src/services/admin/audit.service.ts
- [[listAssessments()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[listAuditLogs()]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[listBanks()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[listLearnerAssessments()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[listMessages()]] - code - apps/api/src/controllers/learner.controller.ts
- [[listQuestions()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[loginRateLimit]] - code - apps/api/src/middleware/rate-limit.middleware.ts
- [[markMessageRead()]] - code - apps/api/src/controllers/learner.controller.ts
- [[patchQuestion()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[quiz.routes.ts]] - code - apps/api/src/routes/quiz.routes.ts
- [[quizRoutes]] - code - apps/api/src/routes/quiz.routes.ts
- [[quota.middleware.ts]] - code - apps/api/src/middleware/quota.middleware.ts
- [[rate-limit.middleware.ts]] - code - apps/api/src/middleware/rate-limit.middleware.ts
- [[readLocale()]] - code - apps/api/src/controllers/learner.controller.ts
- [[reparseRateLimit]] - code - apps/api/src/middleware/rate-limit.middleware.ts
- [[replyToMessage()]] - code - apps/api/src/controllers/learner.controller.ts
- [[requireActiveLearner()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[requireRole()]] - code - apps/api/src/middleware/auth.middleware.ts
- [[requireTenant()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[requireTenant()_1]] - code - apps/api/src/controllers/learner.controller.ts
- [[requireTenantId()_1]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[requireTenantMember()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[requireTenantOwner()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[resolveTenantIdForUser()]] - code - apps/api/src/services/contentAccess.service.ts
- [[scheduleAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[schema_1]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[storage]] - code - apps/api/src/middleware/upload.middleware.ts
- [[streamEvents()]] - code - apps/api/src/controllers/events.controller.ts
- [[submitLearnerAssessment()]] - code - apps/api/src/controllers/assessment.controller.ts
- [[summary.routes.ts]] - code - apps/api/src/routes/summary.routes.ts
- [[summaryRoutes]] - code - apps/api/src/routes/summary.routes.ts
- [[tenant.middleware.ts]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[tenant.routes.ts]] - code - apps/api/src/routes/tenant.routes.ts
- [[tenantContent]] - code - apps/api/src/routes/tenant.routes.ts
- [[tenantRoutes]] - code - apps/api/src/routes/tenant.routes.ts
- [[unreadMessageCount()]] - code - apps/api/src/controllers/learner.controller.ts
- [[upload]] - code - apps/api/src/middleware/upload.middleware.ts
- [[upload.middleware.ts]] - code - apps/api/src/middleware/upload.middleware.ts
- [[usage.routes.ts]] - code - apps/api/src/routes/usage.routes.ts
- [[usageRoutes]] - code - apps/api/src/routes/usage.routes.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/API_Routing__Middleware
SORT file.name ASC
```

## Connections to other communities
- 46 edges to [[_COMMUNITY_Content Access & Media API]]
- 17 edges to [[_COMMUNITY_Subscriptions & Quota]]
- 14 edges to [[_COMMUNITY_Admin API Controllers]]
- 11 edges to [[_COMMUNITY_Bull Jobs & Queues]]
- 6 edges to [[_COMMUNITY_Tenant Progress & Mastery]]
- 5 edges to [[_COMMUNITY_Auth & Tenant Services]]
- 4 edges to [[_COMMUNITY_Content Controllers]]
- 3 edges to [[_COMMUNITY_Shared Types & Locale]]
- 3 edges to [[_COMMUNITY_Slide Deck Generation]]
- 2 edges to [[_COMMUNITY_Chat Streaming API]]
- 2 edges to [[_COMMUNITY_SSE Job Events Bus]]
- 2 edges to [[_COMMUNITY_Quiz API]]
- 2 edges to [[_COMMUNITY_AI Summary & Ingest]]
- 1 edge to [[_COMMUNITY_Admin Analytics]]
- 1 edge to [[_COMMUNITY_Assessment Services]]
- 1 edge to [[_COMMUNITY_Pricing & Upgrade Flow]]

## Top bridge nodes
- [[auth.middleware.ts]] - degree 50, connects to 12 communities
- [[learner.controller.ts]] - degree 19, connects to 5 communities
- [[events.controller.ts]] - degree 10, connects to 5 communities
- [[tenant.routes.ts]] - degree 26, connects to 4 communities
- [[resolveTenantIdForUser()]] - degree 15, connects to 4 communities