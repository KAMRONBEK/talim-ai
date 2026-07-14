---
type: community
cohesion: 0.08
members: 48
---

# Admin API Controllers

**Cohesion:** 0.08 - loosely connected
**Members:** 48 nodes

## Members
- [[GENERATED_KINDS]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[admin-tutor-request.controller.ts]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[admin.controller.ts]] - code - apps/api/src/controllers/admin.controller.ts
- [[approveTutorRequest()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[audit.service.ts]] - code - apps/api/src/services/admin/audit.service.ts
- [[buildUserWhere()]] - code - apps/api/src/controllers/admin/shared.ts
- [[cancelContentJobs()]] - code - apps/api/src/services/queue.service.ts
- [[content.controller.ts]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[contentDetail()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[contentQueue]] - code - apps/api/src/services/queue.service.ts
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
- [[listContents()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[listGenerated()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[listSchema]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[listTenants()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[listTutorRequests()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[listUsers()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[paginationSchema]] - code - apps/api/src/controllers/admin/shared.ts
- [[parseAppLocale()]] - code - packages/types/locale.ts
- [[patchSubscriptionSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchTenant()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
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
- [[shared.ts]] - code - apps/api/src/controllers/admin/shared.ts
- [[signImpersonationToken()]] - code - apps/api/src/lib/impersonation.ts
- [[tenants.controller.ts]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[users.controller.ts]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[writeAdminAuditLog()]] - code - apps/api/src/services/admin/audit.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_API_Controllers
SORT file.name ASC
```

## Connections to other communities
- 31 edges to [[_COMMUNITY_Content Access & Media API]]
- 27 edges to [[_COMMUNITY_Subscriptions & Quota]]
- 20 edges to [[_COMMUNITY_Bull Jobs & Queues]]
- 14 edges to [[_COMMUNITY_API Routing & Middleware]]
- 12 edges to [[_COMMUNITY_Auth & Tenant Services]]
- 5 edges to [[_COMMUNITY_Admin Analytics]]
- 5 edges to [[_COMMUNITY_Content Controllers]]
- 4 edges to [[_COMMUNITY_Shared Types & Locale]]
- 2 edges to [[_COMMUNITY_Tenant Progress & Mastery]]
- 2 edges to [[_COMMUNITY_Question Generation Pipeline]]
- 2 edges to [[_COMMUNITY_Content Stage & Limits]]
- 1 edge to [[_COMMUNITY_Ingest & Usage Services]]
- 1 edge to [[_COMMUNITY_Question Bank Builders]]

## Top bridge nodes
- [[parseAppLocale()]] - degree 22, connects to 9 communities
- [[users.controller.ts]] - degree 43, connects to 6 communities
- [[content.controller.ts]] - degree 29, connects to 5 communities
- [[tenants.controller.ts]] - degree 23, connects to 5 communities
- [[admin-tutor-request.controller.ts]] - degree 14, connects to 4 communities