---
type: community
cohesion: 0.12
members: 30
---

# Admin Audit & Content Controller

**Cohesion:** 0.12 - loosely connected
**Members:** 30 nodes

## Members
- [[admin-audit.controller.ts]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[audit.service.ts]] - code - apps/api/src/services/admin/audit.service.ts
- [[buildUserWhere()]] - code - apps/api/src/controllers/admin/shared.ts
- [[cancelContentJobs()]] - code - apps/api/src/services/queue.service.ts
- [[content.controller.ts]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[createUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[createUserSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[deleteContent()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[deleteGenerated()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[deleteUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[deleteUserSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[formatAdminUser()]] - code - apps/api/src/controllers/admin/shared.ts
- [[generateTemporaryPassword()]] - code - apps/api/src/controllers/admin/shared.ts
- [[listAdminAuditLogs()]] - code - apps/api/src/services/admin/audit.service.ts
- [[listAuditLogs()]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[listContents()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[listGenerated()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[listUsers()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[paginationSchema]] - code - apps/api/src/controllers/admin/shared.ts
- [[patchSubscriptionSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchUserSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchUserSubscription()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[resetPasswordSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[resetUserPassword()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[retryContentJob()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[schema_1]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[shared.ts]] - code - apps/api/src/controllers/admin/shared.ts
- [[users.controller.ts]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[writeAdminAuditLog()]] - code - apps/api/src/services/admin/audit.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Audit__Content_Controller
SORT file.name ASC
```

## Connections to other communities
- 15 edges to [[_COMMUNITY_Tutor-Request & Assessment Controllers]]
- 10 edges to [[_COMMUNITY_Admin Tenants Controller]]
- 7 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 6 edges to [[_COMMUNITY_API Middleware (authquotarate-limit)]]
- 6 edges to [[_COMMUNITY_AI Summary Generation]]
- 5 edges to [[_COMMUNITY_Env Config & Background Job Registration]]
- 4 edges to [[_COMMUNITY_Admin Analytics Controller]]
- 4 edges to [[_COMMUNITY_Subscription Service]]
- 3 edges to [[_COMMUNITY_Tenant-Owner Bootstrap & Role Service]]
- 3 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 2 edges to [[_COMMUNITY_Web API Client & Locale]]
- 2 edges to [[_COMMUNITY_Tenant Content Controller]]
- 1 edge to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 1 edge to [[_COMMUNITY_Usage Pricing & PDF Extraction]]
- 1 edge to [[_COMMUNITY_Quota Smoke Test]]

## Top bridge nodes
- [[users.controller.ts]] - degree 40, connects to 11 communities
- [[content.controller.ts]] - degree 23, connects to 6 communities
- [[shared.ts]] - degree 10, connects to 4 communities
- [[audit.service.ts]] - degree 9, connects to 3 communities
- [[cancelContentJobs()]] - degree 7, connects to 3 communities