---
type: community
cohesion: 0.08
members: 48
---

# Admin Content & Audit

**Cohesion:** 0.08 - loosely connected
**Members:** 48 nodes

## Members
- [[AuthenticatedRequest]] - code - apps/api/src/middleware/auth.middleware.ts
- [[GENERATED_KINDS]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[admin-audit.controller.ts]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[admin.controller.ts]] - code - apps/api/src/controllers/admin.controller.ts
- [[audit.service.ts]] - code - apps/api/src/services/admin/audit.service.ts
- [[buildUserWhere()]] - code - apps/api/src/controllers/admin/shared.ts
- [[cancelContentJobs()]] - code - apps/api/src/services/queue.service.ts
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
- [[getSubscriptionForTenant()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getTenant()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[getUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[impersonateUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[listAdminAuditLogs()]] - code - apps/api/src/services/admin/audit.service.ts
- [[listAuditLogs()]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[listContents()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[listGenerated()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[listTenants()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[listUsers()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[paginationSchema]] - code - apps/api/src/controllers/admin/shared.ts
- [[patchSubscriptionSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchTenant()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[patchTenantSubscriptionSchema]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[patchUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchUserSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchUserSubscription()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[requireActiveTenantSubscription()]] - code - apps/api/src/services/subscription/tenant.ts
- [[resetPasswordSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[resetUserPassword()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[resolveTenantIdForUser()]] - code - apps/api/src/services/contentAccess.service.ts
- [[retryContentJob()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[reviewBodySchema]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[reviewGenerated()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[schema_1]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[shared.ts]] - code - apps/api/src/controllers/admin/shared.ts
- [[signImpersonationToken()]] - code - apps/api/src/lib/impersonation.ts
- [[tenants.controller.ts]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[users.controller.ts]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[writeAdminAuditLog()]] - code - apps/api/src/services/admin/audit.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Content__Audit
SORT file.name ASC
```

## Connections to other communities
- 28 edges to [[_COMMUNITY_Billing, Usage & Limits]]
- 26 edges to [[_COMMUNITY_Assessment & Tutor-Request Controllers]]
- 17 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 8 edges to [[_COMMUNITY_API Middleware]]
- 7 edges to [[_COMMUNITY_Content API Controller]]
- 5 edges to [[_COMMUNITY_Background Jobs & Queues]]
- 5 edges to [[_COMMUNITY_Media & Progress Controllers]]
- 4 edges to [[_COMMUNITY_Admin Analytics Endpoints]]
- 4 edges to [[_COMMUNITY_Tenant Service]]
- 4 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 3 edges to [[_COMMUNITY_Config, Pricing & Embeddings]]
- 3 edges to [[_COMMUNITY_Community 85]]
- 3 edges to [[_COMMUNITY_Auth API Controller]]
- 2 edges to [[_COMMUNITY_Admin Analytics]]
- 2 edges to [[_COMMUNITY_Community 98]]
- 2 edges to [[_COMMUNITY_Community 117]]
- 1 edge to [[_COMMUNITY_Shared Types & Auth Stores]]
- 1 edge to [[_COMMUNITY_AI Tutor Chat API]]
- 1 edge to [[_COMMUNITY_Quiz API Controller]]
- 1 edge to [[_COMMUNITY_Section Service]]
- 1 edge to [[_COMMUNITY_Tenant Owner Controller]]

## Top bridge nodes
- [[AuthenticatedRequest]] - degree 28, connects to 12 communities
- [[users.controller.ts]] - degree 43, connects to 5 communities
- [[content.controller.ts]] - degree 29, connects to 5 communities
- [[tenants.controller.ts]] - degree 23, connects to 5 communities
- [[resolveTenantIdForUser()]] - degree 15, connects to 4 communities