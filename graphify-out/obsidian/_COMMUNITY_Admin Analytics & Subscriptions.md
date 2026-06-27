---
type: community
cohesion: 0.08
members: 41
---

# Admin Analytics & Subscriptions

**Cohesion:** 0.08 - loosely connected
**Members:** 41 nodes

## Members
- [[AuthenticatedRequest]] - code - apps/api/src/middleware/auth.middleware.ts
- [[admin-tutor-request.controller.ts]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[admin.controller.ts]] - code - apps/api/src/controllers/admin.controller.ts
- [[analytics.controller.ts]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[approveTutorRequest()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
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
- [[getSummary()]] - code - apps/api/src/controllers/learner.controller.ts
- [[learner.controller.ts]] - code - apps/api/src/controllers/learner.controller.ts
- [[listContents()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[listGenerated()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[listSchema]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[listSubscriptions()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[listSubscriptionsForAdmin()]] - code - apps/api/src/services/subscription/admin.ts
- [[listTutorRequests()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[listUsers()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[paginationSchema]] - code - apps/api/src/controllers/admin/shared.ts
- [[patchSubscriptionSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchUserSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[patchUserSubscription()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[platformStats()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[rejectTutorRequest()]] - code - apps/api/src/controllers/admin-tutor-request.controller.ts
- [[resetPasswordSchema]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[resetUserPassword()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[retryContentJob()]] - code - apps/api/src/controllers/admin/content.controller.ts
- [[shared.ts]] - code - apps/api/src/controllers/admin/shared.ts
- [[subscriptionListSchema]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[usageDaysSchema]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[usageSummary()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[users.controller.ts]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[writeAdminAuditLog()]] - code - apps/api/src/services/admin/audit.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Analytics__Subscriptions
SORT file.name ASC
```

## Connections to other communities
- 25 edges to [[_COMMUNITY_Tenant Admin & Prisma]]
- 19 edges to [[_COMMUNITY_Content & Podcast API]]
- 18 edges to [[_COMMUNITY_Billing & Usage API]]
- 16 edges to [[_COMMUNITY_Admin Audit & Auth]]
- 7 edges to [[_COMMUNITY_Content Controller]]
- 5 edges to [[_COMMUNITY_Env Config & Jobs]]
- 2 edges to [[_COMMUNITY_Community 35]]
- 2 edges to [[_COMMUNITY_Section & Summary API]]
- 1 edge to [[_COMMUNITY_Slide Deck Types]]
- 1 edge to [[_COMMUNITY_Usage Pricing & Chunk Tools]]
- 1 edge to [[_COMMUNITY_Community 62]]
- 1 edge to [[_COMMUNITY_Community 48]]
- 1 edge to [[_COMMUNITY_Quiz Controller]]
- 1 edge to [[_COMMUNITY_Community 63]]

## Top bridge nodes
- [[AuthenticatedRequest]] - degree 26, connects to 10 communities
- [[users.controller.ts]] - degree 40, connects to 6 communities
- [[content.controller.ts]] - degree 23, connects to 5 communities
- [[admin-tutor-request.controller.ts]] - degree 14, connects to 4 communities
- [[analytics.controller.ts]] - degree 14, connects to 3 communities