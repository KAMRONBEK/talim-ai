---
type: community
cohesion: 0.07
members: 49
---

# Admin Content & Audit Controllers

**Cohesion:** 0.07 - loosely connected
**Members:** 49 nodes

## Members
- [[AuthenticatedRequest]] - code - apps/api/src/middleware/auth.middleware.ts
- [[GENERATED_KINDS]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[admin-audit.controller.ts]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[admin-tutor-request.controller.ts]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[admin.controller.ts]] - code - apps/api/src/controllers/admin.controller.ts
- [[approveTutorRequest()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[audit.service.ts]] - code - apps/api/src/services/admin/audit.service.ts
- [[buildUserWhere()]] - code - apps/api/src/controllers/admin/shared.ts
- [[content.controller.ts]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[contentDetail()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[createUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[createUserSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[deleteContent()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[deleteGenerated()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[deleteUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[deleteUserSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[formatAdminUser()]] - code - apps/api/src/controllers/admin/shared.ts
- [[generateTemporaryPassword()]] - code - apps/api/src/controllers/admin/shared.ts
- [[getChunkSample()]] - code - apps/api/src/services/admin/analytics.service.ts
- [[getMyUsage()]] - code - apps/api/src/controllers/usage.controller.ts
- [[impersonateUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[listAdminAuditLogs()]] - code - apps/api/src/services/admin/audit.service.ts
- [[listAuditLogs()]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[listContents()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[listGenerated()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[listSchema]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[listTenants()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[listTutorRequests()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[listUsers()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[monthToDateRange()]] - code - apps/api/src/controllers/usage.controller.ts
- [[paginationSchema]] - code - apps/api/src/controllers/admin/shared.ts
- [[patchSubscriptionSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchTenantSubscriptionSchema]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[patchUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchUserSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchUserSubscription()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[rejectTutorRequest()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[resetPasswordSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[resetUserPassword()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[retryContentJob()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[reviewBodySchema]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[reviewGenerated()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[schema_1]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[shared.ts]] - code - apps/api/src/controllers/admin/shared.ts
- [[signImpersonationToken()]] - code - apps/api/src/lib/impersonation.ts
- [[tenants.controller.ts]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[usage.controller.ts]] - code - apps/api/src/controllers/usage.controller.ts
- [[users.controller.ts]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[writeAdminAuditLog()]] - code - apps/api/src/services/admin/audit.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Content__Audit_Controllers
SORT file.name ASC
```

## Connections to other communities
- 18 edges to [[_COMMUNITY_API Routes & Middleware]]
- 17 edges to [[_COMMUNITY_Assessment Controller]]
- 17 edges to [[_COMMUNITY_Subscription & Billing Service]]
- 11 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 9 edges to [[_COMMUNITY_Content Media Controllers]]
- 9 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 8 edges to [[_COMMUNITY_Tenant Org & Roles Service]]
- 6 edges to [[_COMMUNITY_Admin Analytics]]
- 6 edges to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 4 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 4 edges to [[_COMMUNITY_Learner Controller]]
- 2 edges to [[_COMMUNITY_Auth Controller]]
- 2 edges to [[_COMMUNITY_Usage Pricing & Metering]]
- 1 edge to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 1 edge to [[_COMMUNITY_AI Tutor Chat Controller]]
- 1 edge to [[_COMMUNITY_Quiz Controller & Grading]]
- 1 edge to [[_COMMUNITY_Section Controller]]
- 1 edge to [[_COMMUNITY_Summary Controller]]

## Top bridge nodes
- [[AuthenticatedRequest]] - degree 29, connects to 13 communities
- [[users.controller.ts]] - degree 43, connects to 9 communities
- [[content.controller.ts]] - degree 29, connects to 8 communities
- [[tenants.controller.ts]] - degree 23, connects to 7 communities
- [[admin-tutor-request.controller.ts]] - degree 14, connects to 5 communities