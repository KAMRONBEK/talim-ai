---
type: community
cohesion: 0.12
members: 51
---

# src routes

**Cohesion:** 0.12 - loosely connected
**Members:** 51 nodes

## Members
- [[admin-rate-limit.middleware.ts]] - code - apps/api/src/middleware/admin-rate-limit.middleware.ts
- [[admin.controller.ts]] - code - apps/api/src/controllers/admin.controller.ts
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
- [[events.routes.ts]] - code - apps/api/src/routes/events.routes.ts
- [[eventsRoutes]] - code - apps/api/src/routes/events.routes.ts
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
- [[storage]] - code - apps/api/src/middleware/upload.middleware.ts
- [[summary.routes.ts]] - code - apps/api/src/routes/summary.routes.ts
- [[summaryRoutes]] - code - apps/api/src/routes/summary.routes.ts
- [[tenant.middleware.ts]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[tenant.routes.ts]] - code - apps/api/src/routes/tenant.routes.ts
- [[tenantContent]] - code - apps/api/src/routes/tenant.routes.ts
- [[tenantRoutes]] - code - apps/api/src/routes/tenant.routes.ts
- [[upload]] - code - apps/api/src/middleware/upload.middleware.ts
- [[upload.middleware.ts]] - code - apps/api/src/middleware/upload.middleware.ts
- [[usage.routes.ts]] - code - apps/api/src/routes/usage.routes.ts
- [[usageRoutes]] - code - apps/api/src/routes/usage.routes.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/src_routes
SORT file.name ASC
```

## Connections to other communities
- 28 edges to [[_COMMUNITY_controllers admin]]
- 15 edges to [[_COMMUNITY_src controllers]]
- 9 edges to [[_COMMUNITY_subscription]]
- 6 edges to [[_COMMUNITY_src controllers · content.controller.ts]]
- 4 edges to [[_COMMUNITY_src services · env.ts]]
- 4 edges to [[_COMMUNITY_services tenant]]
- 3 edges to [[_COMMUNITY_src controllers · assessment.controller.ts]]
- 3 edges to [[_COMMUNITY_src services · slides.controller.ts]]
- 2 edges to [[_COMMUNITY_controllers admin · analytics.controller.ts]]
- 2 edges to [[_COMMUNITY_src controllers · chat.controller.ts]]
- 2 edges to [[_COMMUNITY_src controllers · quiz.controller.ts]]
- 2 edges to [[_COMMUNITY_src controllers · summary.controller.ts]]
- 2 edges to [[_COMMUNITY_src controllers · sendContentFile()]]
- 2 edges to [[_COMMUNITY_src controllers · tenant.controller.ts]]
- 2 edges to [[_COMMUNITY_src jobs]]
- 1 edge to [[_COMMUNITY_packages types]]
- 1 edge to [[_COMMUNITY_web lib · upgrade-dialog.tsx]]

## Top bridge nodes
- [[auth.middleware.ts]] - degree 48, connects to 14 communities
- [[tenant.routes.ts]] - degree 26, connects to 5 communities
- [[quota.middleware.ts]] - degree 14, connects to 4 communities
- [[resolveTenantIdForUser()]] - degree 10, connects to 4 communities
- [[tenant.middleware.ts]] - degree 23, connects to 3 communities