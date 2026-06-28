---
type: community
cohesion: 0.07
members: 58
---

# controllers admin

**Cohesion:** 0.07 - loosely connected
**Members:** 58 nodes

## Members
- [[.constructor()]] - code - apps/api/src/middleware/error.middleware.ts
- [[AppError]] - code - apps/api/src/middleware/error.middleware.ts
- [[AuthenticatedRequest]] - code - apps/api/src/middleware/auth.middleware.ts
- [[PlanFileLimitError]] - code - apps/api/src/middleware/error.middleware.ts
- [[QUOTA_MESSAGES]] - code - apps/api/src/middleware/error.middleware.ts
- [[QuotaExceededError]] - code - apps/api/src/middleware/error.middleware.ts
- [[admin-audit.controller.ts]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[admin-tutor-request.controller.ts]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[approveSchema]] - code - apps/api/src/services/tutorRequest.service.ts
- [[approveTutorRequest()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[audit.service.ts]] - code - apps/api/src/services/admin/audit.service.ts
- [[buildUserWhere()]] - code - apps/api/src/controllers/admin/shared.ts
- [[cancelContentJobs()]] - code - apps/api/src/services/queue.service.ts
- [[content.controller.ts]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[contentQueue]] - code - apps/api/src/services/queue.service.ts
- [[createSchema]] - code - apps/api/src/services/tutorRequest.service.ts
- [[createUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[createUserSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[deleteContent()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[deleteGenerated()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[deleteUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[deleteUserSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[error.middleware.ts]] - code - apps/api/src/middleware/error.middleware.ts
- [[events.controller.ts]] - code - apps/api/src/controllers/events.controller.ts
- [[formatAdminUser()]] - code - apps/api/src/controllers/admin/shared.ts
- [[generateTemporaryPassword()]] - code - apps/api/src/controllers/admin/shared.ts
- [[getMyUsage()]] - code - apps/api/src/controllers/usage.controller.ts
- [[getSummary()]] - code - apps/api/src/controllers/learner.controller.ts
- [[learner.controller.ts]] - code - apps/api/src/controllers/learner.controller.ts
- [[listAdminAuditLogs()]] - code - apps/api/src/services/admin/audit.service.ts
- [[listAuditLogs()]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[listContents()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[listGenerated()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[listSchema]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[listTenants()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[listTutorRequests()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[listTutorRequests()_1]] - code - apps/api/src/services/tutorRequest.service.ts
- [[listUsers()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[monthToDateRange()]] - code - apps/api/src/controllers/usage.controller.ts
- [[paginationSchema]] - code - apps/api/src/controllers/admin/shared.ts
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
- [[schema_1]] - code - apps/api/src/controllers/admin-audit.controller.ts
- [[shared.ts]] - code - apps/api/src/controllers/admin/shared.ts
- [[streamEvents()]] - code - apps/api/src/controllers/events.controller.ts
- [[tenants.controller.ts]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[tutorRequest.service.ts]] - code - apps/api/src/services/tutorRequest.service.ts
- [[usage.controller.ts]] - code - apps/api/src/controllers/usage.controller.ts
- [[users.controller.ts]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[writeAdminAuditLog()]] - code - apps/api/src/services/admin/audit.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/controllers_admin
SORT file.name ASC
```

## Connections to other communities
- 40 edges to [[_COMMUNITY_subscription]]
- 33 edges to [[_COMMUNITY_src controllers]]
- 30 edges to [[_COMMUNITY_services tenant]]
- 28 edges to [[_COMMUNITY_src routes]]
- 10 edges to [[_COMMUNITY_src controllers · content.controller.ts]]
- 8 edges to [[_COMMUNITY_src jobs]]
- 6 edges to [[_COMMUNITY_src services · slides.controller.ts]]
- 6 edges to [[_COMMUNITY_src controllers · sendContentFile()]]
- 6 edges to [[_COMMUNITY_assessment · learner.ts]]
- 4 edges to [[_COMMUNITY_web lib · upgrade-dialog.tsx]]
- 4 edges to [[_COMMUNITY_src services · learning-coverage-prompt.ts]]
- 3 edges to [[_COMMUNITY_controllers admin · analytics.controller.ts]]
- 3 edges to [[_COMMUNITY_src services · env.ts]]
- 3 edges to [[_COMMUNITY_packages types]]
- 3 edges to [[_COMMUNITY_src controllers · assessment.controller.ts]]
- 3 edges to [[_COMMUNITY_src controllers · chat.controller.ts]]
- 3 edges to [[_COMMUNITY_src controllers · quiz.controller.ts]]
- 3 edges to [[_COMMUNITY_src controllers · summary.controller.ts]]
- 3 edges to [[_COMMUNITY_src controllers · tenant.controller.ts]]
- 2 edges to [[_COMMUNITY_packages types · api.ts]]
- 2 edges to [[_COMMUNITY_src services · usage-pricing.ts]]
- 2 edges to [[_COMMUNITY_assessment · assessments.ts]]
- 2 edges to [[_COMMUNITY_assessment]]

## Top bridge nodes
- [[error.middleware.ts]] - degree 52, connects to 19 communities
- [[AppError]] - degree 46, connects to 16 communities
- [[AuthenticatedRequest]] - degree 28, connects to 13 communities
- [[users.controller.ts]] - degree 40, connects to 6 communities
- [[content.controller.ts]] - degree 23, connects to 5 communities