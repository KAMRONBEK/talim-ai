---
type: community
cohesion: 0.08
members: 41
---

# Admin Content & Audit

**Cohesion:** 0.08 - loosely connected
**Members:** 41 nodes

## Members
- [[GENERATED_KINDS]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[admin-audit.controller.ts]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[admin-tutor-request.controller.ts]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[approveTutorRequest()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
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
- [[impersonateUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[listAdminAuditLogs()]] - code - apps/api/src/services/admin/audit.service.ts
- [[listAuditLogs()]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[listContents()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[listGenerated()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[listSchema]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[listTutorRequests()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[listUsers()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[paginationSchema]] - code - apps/api/src/controllers/admin/shared.ts
- [[patchSubscriptionSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchUserSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[rejectTutorRequest()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[resetPasswordSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[resetUserPassword()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[retryContentJob()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[reviewBodySchema]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[reviewGenerated()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[schema_1]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[shared.ts]] - code - apps/api/src/controllers/admin/shared.ts
- [[signImpersonationToken()]] - code - apps/api/src/lib/impersonation.ts
- [[users.controller.ts]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[writeAdminAuditLog()]] - code - apps/api/src/services/admin/audit.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Content__Audit
SORT file.name ASC
```

## Connections to other communities
- 22 edges to [[_COMMUNITY_Admin Tenants & Prisma Core]]
- 18 edges to [[_COMMUNITY_Content API Controllers]]
- 15 edges to [[_COMMUNITY_Admin & Usage Controllers]]
- 11 edges to [[_COMMUNITY_Billing & Quota]]
- 6 edges to [[_COMMUNITY_Env Config & Job Events]]
- 4 edges to [[_COMMUNITY_Content Upload & Ingest]]
- 2 edges to [[_COMMUNITY_Community 56]]
- 2 edges to [[_COMMUNITY_Community 51]]
- 2 edges to [[_COMMUNITY_Community 98]]
- 1 edge to [[_COMMUNITY_Shared Types & Chat Hooks]]
- 1 edge to [[_COMMUNITY_Community 50]]

## Top bridge nodes
- [[users.controller.ts]] - degree 43, connects to 6 communities
- [[content.controller.ts]] - degree 29, connects to 6 communities
- [[shared.ts]] - degree 10, connects to 4 communities
- [[admin-tutor-request.controller.ts]] - degree 14, connects to 3 communities
- [[cancelContentJobs()]] - degree 7, connects to 3 communities