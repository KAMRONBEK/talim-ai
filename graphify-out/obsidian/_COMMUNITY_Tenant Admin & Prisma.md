---
type: community
cohesion: 0.07
members: 65
---

# Tenant Admin & Prisma

**Cohesion:** 0.07 - loosely connected
**Members:** 65 nodes

## Members
- [[.constructor()]] - code - apps/api/src/middleware/error.middleware.ts
- [[AdminRoleChangeInput]] - code - apps/api/src/services/adminUserRole.service.ts
- [[AppError]] - code - apps/api/src/middleware/error.middleware.ts
- [[PLANS]] - code - apps/api/src/prisma/seed.ts
- [[PlanSeed]] - code - apps/api/src/prisma/seed.ts
- [[adminUpdateTenantSubscription()]] - code - apps/api/src/services/subscription/tenant.ts
- [[adminUserRole.service.ts]] - code - apps/api/src/services/adminUserRole.service.ts
- [[applyAdminRoleChange()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[approveSchema]] - code - apps/api/src/services/tutorRequest.service.ts
- [[assignContent()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[assignmentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[assignments.ts]] - code - apps/api/src/services/tenant/assignments.ts
- [[audit.service.ts]] - code - apps/api/src/services/admin/audit.service.ts
- [[computeStreakDays()]] - code - apps/api/src/services/learningProgress.service.ts
- [[create-admin.ts]] - code - apps/api/src/scripts/create-admin.ts
- [[create-tenant-owner.ts]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[createSchema]] - code - apps/api/src/services/tutorRequest.service.ts
- [[createStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[createStudentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[createTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[deleteStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[ensureIndividualSubscription()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[ensureTenantSubscription()]] - code - apps/api/src/services/tenant/organization.ts
- [[formatStudentRow()]] - code - apps/api/src/services/tenant/shared.ts
- [[formatTenant()]] - code - apps/api/src/services/tenant/shared.ts
- [[generateUniqueJoinCode()]] - code - apps/api/src/services/tenant/shared.ts
- [[getDefaultTenantPlanId()]] - code - apps/api/src/services/tenant/shared.ts
- [[getLearnerSummary()]] - code - apps/api/src/services/tenant/progress.ts
- [[getStudentProgress()_1]] - code - apps/api/src/services/tenant/progress.ts
- [[getTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[getTenantProgress()]] - code - apps/api/src/services/tenant/progress.ts
- [[listContentAssignments()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[listStudents()_1]] - code - apps/api/src/services/tenant/students.ts
- [[listTenants()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[listTutorRequests()_1]] - code - apps/api/src/services/tutorRequest.service.ts
- [[main()]] - code - apps/api/src/prisma/seed.ts
- [[main()_1]] - code - apps/api/src/scripts/create-admin.ts
- [[main()_2]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[organization.ts]] - code - apps/api/src/services/tenant/organization.ts
- [[parseArgs()]] - code - apps/api/src/scripts/create-admin.ts
- [[parseArgs()_1]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[patchStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[patchStudentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[patchTenant()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[patchTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[patchTenantSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[patchTenantSubscriptionSchema]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[prisma_2]] - code - apps/api/src/lib/prisma.ts
- [[prisma.ts]] - code - apps/api/src/lib/prisma.ts
- [[progress.ts]] - code - apps/api/src/services/tenant/progress.ts
- [[randomJoinCode()]] - code - apps/api/src/services/tenant/shared.ts
- [[regenerateJoinCode()_1]] - code - apps/api/src/services/tenant/organization.ts
- [[resetStudentPassword()_1]] - code - apps/api/src/services/tenant/students.ts
- [[seed.ts]] - code - apps/api/src/prisma/seed.ts
- [[shared.ts_3]] - code - apps/api/src/services/tenant/shared.ts
- [[slugifyOrgName()]] - code - apps/api/src/lib/tenant-slug.ts
- [[students.ts]] - code - apps/api/src/services/tenant/students.ts
- [[tenant-slug.ts]] - code - apps/api/src/lib/tenant-slug.ts
- [[tenant.service.ts]] - code - apps/api/src/services/tenant.service.ts
- [[tenants.controller.ts]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[todayUtcDate()]] - code - apps/api/src/services/learningProgress.service.ts
- [[transferTenantOwnership()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[tutorRequest.service.ts]] - code - apps/api/src/services/tutorRequest.service.ts
- [[unassignContent()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[uniqueSlug()]] - code - apps/api/src/services/tenant/shared.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant_Admin__Prisma
SORT file.name ASC
```

## Connections to other communities
- 43 edges to [[_COMMUNITY_Billing & Usage API]]
- 25 edges to [[_COMMUNITY_Admin Analytics & Subscriptions]]
- 21 edges to [[_COMMUNITY_Admin Audit & Auth]]
- 15 edges to [[_COMMUNITY_Content & Podcast API]]
- 11 edges to [[_COMMUNITY_Content Controller]]
- 10 edges to [[_COMMUNITY_Usage Pricing & Chunk Tools]]
- 9 edges to [[_COMMUNITY_Quiz Controller]]
- 9 edges to [[_COMMUNITY_Section & Summary API]]
- 9 edges to [[_COMMUNITY_Community 51]]
- 8 edges to [[_COMMUNITY_Env Config & Jobs]]
- 3 edges to [[_COMMUNITY_Community 48]]
- 3 edges to [[_COMMUNITY_Community 87]]
- 3 edges to [[_COMMUNITY_Community 46]]
- 3 edges to [[_COMMUNITY_Deck Prompt Builder]]
- 2 edges to [[_COMMUNITY_Community 63]]
- 2 edges to [[_COMMUNITY_Community 67]]
- 1 edge to [[_COMMUNITY_Community 62]]

## Top bridge nodes
- [[prisma.ts]] - degree 54, connects to 15 communities
- [[prisma_2]] - degree 54, connects to 15 communities
- [[AppError]] - degree 44, connects to 14 communities
- [[tenants.controller.ts]] - degree 23, connects to 4 communities
- [[tutorRequest.service.ts]] - degree 16, connects to 3 communities