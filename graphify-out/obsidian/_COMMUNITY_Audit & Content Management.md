---
type: community
cohesion: 0.07
members: 54
---

# Audit & Content Management

**Cohesion:** 0.07 - loosely connected
**Members:** 54 nodes

## Members
- [[AuthenticatedRequest]] - code - apps/api/src/middleware/auth.middleware.ts
- [[GENERATED_KINDS]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[admin-audit.controller.ts]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[admin-tutor-request.controller.ts]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[admin.controller.ts]] - code - apps/api/src/controllers/admin.controller.ts
- [[adminUpdateTenantSubscription()]] - code - apps/api/src/services/subscription/tenant.ts
- [[approveTutorRequest()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[audit.service.ts]] - code - apps/api/src/services/admin/audit.service.ts
- [[buildUserWhere()]] - code - apps/api/src/controllers/admin/shared.ts
- [[cancelContentJobs()]] - code - apps/api/src/services/queue.service.ts
- [[content.controller.ts]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[contentDetail()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[create-tenant-owner.ts]] - code - apps/api/src/scripts/create-tenant-owner.ts
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
- [[main()_2]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[monthToDateRange()]] - code - apps/api/src/controllers/usage.controller.ts
- [[paginationSchema]] - code - apps/api/src/controllers/admin/shared.ts
- [[parseArgs()_1]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[patchSubscriptionSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchTenant()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[patchTenantSubscriptionSchema]] - code - apps/api/src/controllers/admin/tenants.controller.ts
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
- [[tenants.controller.ts]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[usage.controller.ts]] - code - apps/api/src/controllers/usage.controller.ts
- [[users.controller.ts]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[writeAdminAuditLog()]] - code - apps/api/src/services/admin/audit.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Audit__Content_Management
SORT file.name ASC
```

## Connections to other communities
- 32 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 27 edges to [[_COMMUNITY_Content Controller (YouTubeOCR)]]
- 24 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 9 edges to [[_COMMUNITY_Assessment Controller]]
- 8 edges to [[_COMMUNITY_Flashcards & Podcast Controllers]]
- 5 edges to [[_COMMUNITY_Auth Controller]]
- 5 edges to [[_COMMUNITY_Admin Role Management]]
- 4 edges to [[_COMMUNITY_Analytics Controller]]
- 4 edges to [[_COMMUNITY_Tenant Service & Assignments]]
- 2 edges to [[_COMMUNITY_Analytics & Usage Pricing]]
- 2 edges to [[_COMMUNITY_Embedding & Chunk Inspection]]
- 1 edge to [[_COMMUNITY_Admin Content & Subscriptions]]
- 1 edge to [[_COMMUNITY_Chat Controller (SSE)]]
- 1 edge to [[_COMMUNITY_Job Event Bus]]
- 1 edge to [[_COMMUNITY_Learner API Controller]]
- 1 edge to [[_COMMUNITY_Quiz Controller]]
- 1 edge to [[_COMMUNITY_Summary Controller]]
- 1 edge to [[_COMMUNITY_Tenant Student Management]]

## Top bridge nodes
- [[AuthenticatedRequest]] - degree 29, connects to 13 communities
- [[users.controller.ts]] - degree 43, connects to 6 communities
- [[admin-tutor-request.controller.ts]] - degree 14, connects to 5 communities
- [[content.controller.ts]] - degree 29, connects to 4 communities
- [[tenants.controller.ts]] - degree 23, connects to 4 communities