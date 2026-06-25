---
type: community
cohesion: 0.13
members: 46
---

# API Middleware (auth/quota/rate-limit)

**Cohesion:** 0.13 - loosely connected
**Members:** 46 nodes

## Members
- [[admin-rate-limit.middleware.ts]] - code - apps/api/src/middleware/admin-rate-limit.middleware.ts
- [[admin.routes.ts]] - code - apps/api/src/routes/admin.routes.ts
- [[adminRateLimit()]] - code - apps/api/src/middleware/admin-rate-limit.middleware.ts
- [[adminRoutes]] - code - apps/api/src/routes/admin.routes.ts
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
- [[enforceQuota()]] - code - apps/api/src/middleware/quota.middleware.ts
- [[index.ts_1]] - code - apps/api/src/routes/index.ts
- [[learner.routes.ts]] - code - apps/api/src/routes/learner.routes.ts
- [[learnerRoutes]] - code - apps/api/src/routes/learner.routes.ts
- [[loginRateLimit]] - code - apps/api/src/middleware/rate-limit.middleware.ts
- [[quiz.routes.ts]] - code - apps/api/src/routes/quiz.routes.ts
- [[quizRoutes]] - code - apps/api/src/routes/quiz.routes.ts
- [[quota.middleware.ts]] - code - apps/api/src/middleware/quota.middleware.ts
- [[rate-limit.middleware.ts]] - code - apps/api/src/middleware/rate-limit.middleware.ts
- [[reparseRateLimit]] - code - apps/api/src/middleware/rate-limit.middleware.ts
- [[requireActiveLearner()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[requireRole()]] - code - apps/api/src/middleware/auth.middleware.ts
- [[requireTenantId()_1]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[requireTenantMember()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[requireTenantOwner()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[resolveTenantIdForUser()]] - code - apps/api/src/services/contentAccess.service.ts
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
TABLE source_file, type FROM #community/API_Middleware_auth/quota/rate-limit
SORT file.name ASC
```

## Connections to other communities
- 18 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 13 edges to [[_COMMUNITY_Podcast & Progress Controllers]]
- 7 edges to [[_COMMUNITY_Env Config & Background Job Registration]]
- 6 edges to [[_COMMUNITY_Admin Audit & Content Controller]]
- 6 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 6 edges to [[_COMMUNITY_AI Summary Generation]]
- 5 edges to [[_COMMUNITY_Tutor-Request & Assessment Controllers]]
- 4 edges to [[_COMMUNITY_Auth Controller (loginjoinpassword)]]
- 2 edges to [[_COMMUNITY_Admin Analytics Controller]]
- 2 edges to [[_COMMUNITY_Admin Tenants Controller]]
- 2 edges to [[_COMMUNITY_Chat Controller & Sessions]]
- 2 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 2 edges to [[_COMMUNITY_Tenant Content Controller]]
- 2 edges to [[_COMMUNITY_Tenant Controller (studentsprogress)]]
- 1 edge to [[_COMMUNITY_Subscription Service]]
- 1 edge to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]

## Top bridge nodes
- [[auth.middleware.ts]] - degree 45, connects to 14 communities
- [[tenant.routes.ts]] - degree 25, connects to 6 communities
- [[content.routes.ts]] - degree 22, connects to 4 communities
- [[quota.middleware.ts]] - degree 14, connects to 4 communities
- [[resolveTenantIdForUser()]] - degree 10, connects to 4 communities