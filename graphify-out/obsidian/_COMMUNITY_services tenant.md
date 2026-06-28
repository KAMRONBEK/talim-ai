---
type: community
cohesion: 0.06
members: 61
---

# services tenant

**Cohesion:** 0.06 - loosely connected
**Members:** 61 nodes

## Members
- [[AdminRoleChangeInput]] - code - apps/api/src/services/adminUserRole.service.ts
- [[adminUpdateTenantSubscription()]] - code - apps/api/src/services/subscription/tenant.ts
- [[adminUserRole.service.ts]] - code - apps/api/src/services/adminUserRole.service.ts
- [[applyAdminRoleChange()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[approveTutorRequest()_1]] - code - apps/api/src/services/tutorRequest.service.ts
- [[assignContent()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[assignmentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[assignments.ts]] - code - apps/api/src/services/tenant/assignments.ts
- [[auth.controller.ts]] - code - apps/api/src/controllers/auth.controller.ts
- [[changePassword()]] - code - apps/api/src/controllers/auth.controller.ts
- [[changePasswordSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[create-tenant-owner.ts]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[createStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[createStudentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[createTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[createTutorRequest()]] - code - apps/api/src/services/tutorRequest.service.ts
- [[deleteStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[ensureIndividualSubscription()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[ensureTenantSubscription()]] - code - apps/api/src/services/tenant/organization.ts
- [[formatRequest()]] - code - apps/api/src/services/tutorRequest.service.ts
- [[formatStudentRow()]] - code - apps/api/src/services/tenant/shared.ts
- [[formatTenant()]] - code - apps/api/src/services/tenant/shared.ts
- [[formatUser()]] - code - apps/api/src/controllers/auth.controller.ts
- [[generateUniqueJoinCode()]] - code - apps/api/src/services/tenant/shared.ts
- [[getDefaultTenantPlanId()]] - code - apps/api/src/services/tenant/shared.ts
- [[getMyLatestTutorRequest()]] - code - apps/api/src/services/tutorRequest.service.ts
- [[getTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[getTutorRequest()]] - code - apps/api/src/controllers/auth.controller.ts
- [[joinClass()]] - code - apps/api/src/controllers/auth.controller.ts
- [[joinSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[joinTenantByCode()]] - code - apps/api/src/services/tenant/organization.ts
- [[listContentAssignments()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[login()]] - code - apps/api/src/controllers/auth.controller.ts
- [[loginSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[main()_2]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[me()]] - code - apps/api/src/controllers/auth.controller.ts
- [[organization.ts]] - code - apps/api/src/services/tenant/organization.ts
- [[parseArgs()_1]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[patchStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[patchStudentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[patchTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[patchTenantSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[randomJoinCode()]] - code - apps/api/src/services/tenant/shared.ts
- [[regenerateJoinCode()_1]] - code - apps/api/src/services/tenant/organization.ts
- [[register()]] - code - apps/api/src/controllers/auth.controller.ts
- [[registerSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[registerTenant()]] - code - apps/api/src/controllers/auth.controller.ts
- [[rejectTutorRequest()_1]] - code - apps/api/src/services/tutorRequest.service.ts
- [[resetStudentPassword()_1]] - code - apps/api/src/services/tenant/students.ts
- [[shared.ts_3]] - code - apps/api/src/services/tenant/shared.ts
- [[signToken()]] - code - apps/api/src/controllers/auth.controller.ts
- [[slugifyOrgName()]] - code - apps/api/src/lib/tenant-slug.ts
- [[students.ts]] - code - apps/api/src/services/tenant/students.ts
- [[tenant-slug.ts]] - code - apps/api/src/lib/tenant-slug.ts
- [[tenant.service.ts]] - code - apps/api/src/services/tenant.service.ts
- [[transferTenantOwnership()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[unassignContent()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[uniqueSlug()]] - code - apps/api/src/services/tenant/shared.ts
- [[updateMe()]] - code - apps/api/src/controllers/auth.controller.ts
- [[updateMeSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[upgradeToTenant()]] - code - apps/api/src/controllers/auth.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/services_tenant
SORT file.name ASC
```

## Connections to other communities
- 30 edges to [[_COMMUNITY_controllers admin]]
- 25 edges to [[_COMMUNITY_subscription]]
- 4 edges to [[_COMMUNITY_src routes]]
- 3 edges to [[_COMMUNITY_src services · learning-coverage-prompt.ts]]
- 2 edges to [[_COMMUNITY_src services · env.ts]]
- 2 edges to [[_COMMUNITY_packages types · api.ts]]
- 1 edge to [[_COMMUNITY_src controllers · content.controller.ts]]
- 1 edge to [[_COMMUNITY_packages types]]
- 1 edge to [[_COMMUNITY_src controllers · tenant.controller.ts]]

## Top bridge nodes
- [[auth.controller.ts]] - degree 34, connects to 7 communities
- [[students.ts]] - degree 17, connects to 3 communities
- [[tenant.service.ts]] - degree 12, connects to 3 communities
- [[shared.ts_3]] - degree 20, connects to 2 communities
- [[organization.ts]] - degree 19, connects to 2 communities