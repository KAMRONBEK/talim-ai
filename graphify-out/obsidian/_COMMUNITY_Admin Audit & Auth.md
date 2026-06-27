---
type: community
cohesion: 0.06
members: 77
---

# Admin Audit & Auth

**Cohesion:** 0.06 - loosely connected
**Members:** 77 nodes

## Members
- [[AuthPayload]] - code - apps/api/src/middleware/auth.middleware.ts
- [[admin-audit.controller.ts]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[admin-rate-limit.middleware.ts]] - code - apps/api/src/middleware/admin-rate-limit.middleware.ts
- [[admin.routes.ts]] - code - apps/api/src/routes/admin.routes.ts
- [[adminRateLimit()]] - code - apps/api/src/middleware/admin-rate-limit.middleware.ts
- [[adminRoutes]] - code - apps/api/src/routes/admin.routes.ts
- [[approveTutorRequest()_1]] - code - apps/api/src/services/tutorRequest.service.ts
- [[asyncHandler()]] - code - apps/api/src/lib/asyncHandler.ts
- [[asyncHandler.ts]] - code - apps/api/src/lib/asyncHandler.ts
- [[attachTenantId()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[auth.controller.ts]] - code - apps/api/src/controllers/auth.controller.ts
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
- [[changePassword()]] - code - apps/api/src/controllers/auth.controller.ts
- [[changePasswordSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[chat.routes.ts]] - code - apps/api/src/routes/chat.routes.ts
- [[chatRoutes]] - code - apps/api/src/routes/chat.routes.ts
- [[content.routes.ts]] - code - apps/api/src/routes/content.routes.ts
- [[contentRoutes]] - code - apps/api/src/routes/content.routes.ts
- [[createTutorRequest()]] - code - apps/api/src/services/tutorRequest.service.ts
- [[enforceQuota()]] - code - apps/api/src/middleware/quota.middleware.ts
- [[formatRequest()]] - code - apps/api/src/services/tutorRequest.service.ts
- [[formatUser()]] - code - apps/api/src/controllers/auth.controller.ts
- [[getMyLatestTutorRequest()]] - code - apps/api/src/services/tutorRequest.service.ts
- [[getTutorRequest()]] - code - apps/api/src/controllers/auth.controller.ts
- [[index.ts_1]] - code - apps/api/src/routes/index.ts
- [[joinClass()]] - code - apps/api/src/controllers/auth.controller.ts
- [[joinSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[joinTenantByCode()]] - code - apps/api/src/services/tenant/organization.ts
- [[learner.routes.ts]] - code - apps/api/src/routes/learner.routes.ts
- [[learnerRoutes]] - code - apps/api/src/routes/learner.routes.ts
- [[listAdminAuditLogs()]] - code - apps/api/src/services/admin/audit.service.ts
- [[listAuditLogs()]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[login()]] - code - apps/api/src/controllers/auth.controller.ts
- [[loginRateLimit]] - code - apps/api/src/middleware/rate-limit.middleware.ts
- [[loginSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[me()]] - code - apps/api/src/controllers/auth.controller.ts
- [[quiz.routes.ts]] - code - apps/api/src/routes/quiz.routes.ts
- [[quizRoutes]] - code - apps/api/src/routes/quiz.routes.ts
- [[quota.middleware.ts]] - code - apps/api/src/middleware/quota.middleware.ts
- [[rate-limit.middleware.ts]] - code - apps/api/src/middleware/rate-limit.middleware.ts
- [[register()]] - code - apps/api/src/controllers/auth.controller.ts
- [[registerSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[registerTenant()]] - code - apps/api/src/controllers/auth.controller.ts
- [[rejectTutorRequest()_1]] - code - apps/api/src/services/tutorRequest.service.ts
- [[reparseRateLimit]] - code - apps/api/src/middleware/rate-limit.middleware.ts
- [[requireActiveLearner()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[requireRole()]] - code - apps/api/src/middleware/auth.middleware.ts
- [[requireTenantId()_1]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[requireTenantMember()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[requireTenantOwner()]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[resolveTenantIdForUser()]] - code - apps/api/src/services/contentAccess.service.ts
- [[routes]] - code - apps/api/src/routes/index.ts
- [[schema_1]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[signToken()]] - code - apps/api/src/controllers/auth.controller.ts
- [[storage]] - code - apps/api/src/middleware/upload.middleware.ts
- [[summary.routes.ts]] - code - apps/api/src/routes/summary.routes.ts
- [[summaryRoutes]] - code - apps/api/src/routes/summary.routes.ts
- [[tenant.middleware.ts]] - code - apps/api/src/middleware/tenant.middleware.ts
- [[tenant.routes.ts]] - code - apps/api/src/routes/tenant.routes.ts
- [[tenantContent]] - code - apps/api/src/routes/tenant.routes.ts
- [[tenantRoutes]] - code - apps/api/src/routes/tenant.routes.ts
- [[updateMe()]] - code - apps/api/src/controllers/auth.controller.ts
- [[updateMeSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[upgradeToTenant()]] - code - apps/api/src/controllers/auth.controller.ts
- [[upload]] - code - apps/api/src/middleware/upload.middleware.ts
- [[upload.middleware.ts]] - code - apps/api/src/middleware/upload.middleware.ts
- [[usage.routes.ts]] - code - apps/api/src/routes/usage.routes.ts
- [[usageRoutes]] - code - apps/api/src/routes/usage.routes.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Audit__Auth
SORT file.name ASC
```

## Connections to other communities
- 21 edges to [[_COMMUNITY_Tenant Admin & Prisma]]
- 16 edges to [[_COMMUNITY_Admin Analytics & Subscriptions]]
- 13 edges to [[_COMMUNITY_Billing & Usage API]]
- 12 edges to [[_COMMUNITY_Content & Podcast API]]
- 9 edges to [[_COMMUNITY_Content Controller]]
- 8 edges to [[_COMMUNITY_Env Config & Jobs]]
- 5 edges to [[_COMMUNITY_Section & Summary API]]
- 3 edges to [[_COMMUNITY_Community 62]]
- 2 edges to [[_COMMUNITY_Slide Deck Types]]
- 2 edges to [[_COMMUNITY_Community 35]]
- 2 edges to [[_COMMUNITY_Community 48]]
- 2 edges to [[_COMMUNITY_Quiz Controller]]
- 2 edges to [[_COMMUNITY_Community 63]]

## Top bridge nodes
- [[auth.middleware.ts]] - degree 45, connects to 11 communities
- [[auth.controller.ts]] - degree 34, connects to 7 communities
- [[tenant.routes.ts]] - degree 25, connects to 5 communities
- [[tenant.middleware.ts]] - degree 22, connects to 4 communities
- [[quota.middleware.ts]] - degree 14, connects to 4 communities