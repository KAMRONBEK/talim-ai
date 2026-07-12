---
type: community
cohesion: 0.10
members: 58
---

# Admin & Usage Controllers

**Cohesion:** 0.10 - loosely connected
**Members:** 58 nodes

## Members
- [[AuthenticatedRequest]] - code - apps/api/src/middleware/auth.middleware.ts
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
- [[events.controller.ts]] - code - apps/api/src/controllers/events.controller.ts
- [[events.routes.ts]] - code - apps/api/src/routes/events.routes.ts
- [[eventsRoutes]] - code - apps/api/src/routes/events.routes.ts
- [[getMyUsage()]] - code - apps/api/src/controllers/usage.controller.ts
- [[index.ts_1]] - code - apps/api/src/routes/index.ts
- [[learner.routes.ts]] - code - apps/api/src/routes/learner.routes.ts
- [[learnerRoutes]] - code - apps/api/src/routes/learner.routes.ts
- [[loginRateLimit]] - code - apps/api/src/middleware/rate-limit.middleware.ts
- [[monthToDateRange()]] - code - apps/api/src/controllers/usage.controller.ts
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
- [[routes]] - code - apps/api/src/routes/index.ts
- [[storage]] - code - apps/api/src/middleware/upload.middleware.ts
- [[streamEvents()]] - code - apps/api/src/controllers/events.controller.ts
- [[summary.routes.ts]] - code - apps/api/src/routes/summary.routes.ts
- [[summaryRoutes]] - code - apps/api/src/routes/summary.routes.ts
- [[tenant.middleware.ts]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[tenant.routes.ts]] - code - apps/api/src/routes/tenant.routes.ts
- [[tenantContent]] - code - apps/api/src/routes/tenant.routes.ts
- [[tenantRoutes]] - code - apps/api/src/routes/tenant.routes.ts
- [[upload]] - code - apps/api/src/middleware/upload.middleware.ts
- [[upload.middleware.ts]] - code - apps/api/src/middleware/upload.middleware.ts
- [[usage.controller.ts]] - code - apps/api/src/controllers/usage.controller.ts
- [[usage.routes.ts]] - code - apps/api/src/routes/usage.routes.ts
- [[usageRoutes]] - code - apps/api/src/routes/usage.routes.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin__Usage_Controllers
SORT file.name ASC
```

## Connections to other communities
- 27 edges to [[_COMMUNITY_Content API Controllers]]
- 21 edges to [[_COMMUNITY_Admin Tenants & Prisma Core]]
- 15 edges to [[_COMMUNITY_Admin Content & Audit]]
- 9 edges to [[_COMMUNITY_Billing & Quota]]
- 8 edges to [[_COMMUNITY_Env Config & Job Events]]
- 6 edges to [[_COMMUNITY_Content Upload & Ingest]]
- 5 edges to [[_COMMUNITY_Community 47]]
- 4 edges to [[_COMMUNITY_Community 63]]
- 3 edges to [[_COMMUNITY_Community 56]]
- 3 edges to [[_COMMUNITY_AI Tutor Chat API]]
- 3 edges to [[_COMMUNITY_Community 93]]
- 3 edges to [[_COMMUNITY_Community 58]]
- 3 edges to [[_COMMUNITY_Community 48]]
- 2 edges to [[_COMMUNITY_Shared Types & Chat Hooks]]
- 2 edges to [[_COMMUNITY_Community 92]]
- 2 edges to [[_COMMUNITY_Community 80]]
- 1 edge to [[_COMMUNITY_Community 95]]
- 1 edge to [[_COMMUNITY_Community 50]]

## Top bridge nodes
- [[auth.middleware.ts]] - degree 49, connects to 13 communities
- [[AuthenticatedRequest]] - degree 28, connects to 12 communities
- [[resolveTenantIdForUser()]] - degree 15, connects to 6 communities
- [[tenant.routes.ts]] - degree 26, connects to 4 communities
- [[events.controller.ts]] - degree 10, connects to 4 communities