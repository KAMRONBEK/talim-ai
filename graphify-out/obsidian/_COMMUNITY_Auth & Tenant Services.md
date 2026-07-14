---
type: community
cohesion: 0.05
members: 74
---

# Auth & Tenant Services

**Cohesion:** 0.05 - loosely connected
**Members:** 74 nodes

## Members
- [[AdminRoleChangeInput]] - code - apps/api/src/services/adminUserRole.service.ts
- [[ImportRowInput]] - code - apps/api/src/services/tenant/students.ts
- [[ProvisionStudentParams]] - code - apps/api/src/services/tenant/students.ts
- [[ProvisionStudentResult]] - code - apps/api/src/services/tenant/students.ts
- [[StudentImportRowReport]] - code - apps/api/src/services/tenant/students.ts
- [[adminUpdateTenantSubscription()]] - code - apps/api/src/services/subscription/tenant.ts
- [[adminUserRole.service.ts]] - code - apps/api/src/services/adminUserRole.service.ts
- [[applyAdminRoleChange()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[approveSchema]] - code - apps/api/src/services/tutorRequest.service.ts
- [[approveTutorRequest()_1]] - code - apps/api/src/services/tutorRequest.service.ts
- [[assignContent()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[assignmentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[assignments.ts]] - code - apps/api/src/services/tenant/assignments.ts
- [[auth.controller.ts]] - code - apps/api/src/controllers/auth.controller.ts
- [[changePassword()]] - code - apps/api/src/controllers/auth.controller.ts
- [[changePasswordSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[create-tenant-owner.ts]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[createSchema]] - code - apps/api/src/services/tutorRequest.service.ts
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
- [[generateImportUsername()]] - code - apps/api/src/services/tenant/students.ts
- [[generateUniqueJoinCode()]] - code - apps/api/src/services/tenant/shared.ts
- [[getDefaultTenantPlanId()]] - code - apps/api/src/services/tenant/shared.ts
- [[getMyLatestTutorRequest()]] - code - apps/api/src/services/tutorRequest.service.ts
- [[getTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[getTutorRequest()]] - code - apps/api/src/controllers/auth.controller.ts
- [[importStudents()_1]] - code - apps/api/src/services/tenant/students.ts
- [[joinClass()]] - code - apps/api/src/controllers/auth.controller.ts
- [[joinSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[joinTenantByCode()]] - code - apps/api/src/services/tenant/organization.ts
- [[listContentAssignments()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[listTutorRequests()_1]] - code - apps/api/src/services/tutorRequest.service.ts
- [[login()]] - code - apps/api/src/controllers/auth.controller.ts
- [[loginSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[main()_2]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[me()]] - code - apps/api/src/controllers/auth.controller.ts
- [[normalizeImportInput()]] - code - apps/api/src/services/tenant/students.ts
- [[organization.ts]] - code - apps/api/src/services/tenant/organization.ts
- [[parseArgs()_1]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[parseCsv()]] - code - apps/api/src/services/tenant/students.ts
- [[patchStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[patchStudentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[patchTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[patchTenantSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[provisionStudent()]] - code - apps/api/src/services/tenant/students.ts
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
- [[tutorRequest.service.ts]] - code - apps/api/src/services/tutorRequest.service.ts
- [[unassignContent()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[uniqueSlug()]] - code - apps/api/src/services/tenant/shared.ts
- [[updateMe()]] - code - apps/api/src/controllers/auth.controller.ts
- [[updateMeSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[upgradeToTenant()]] - code - apps/api/src/controllers/auth.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Auth__Tenant_Services
SORT file.name ASC
```

## Connections to other communities
- 26 edges to [[_COMMUNITY_Subscriptions & Quota]]
- 18 edges to [[_COMMUNITY_Bull Jobs & Queues]]
- 12 edges to [[_COMMUNITY_Admin API Controllers]]
- 5 edges to [[_COMMUNITY_API Routing & Middleware]]
- 4 edges to [[_COMMUNITY_Tenant Progress & Mastery]]
- 2 edges to [[_COMMUNITY_Content Access & Media API]]
- 1 edge to [[_COMMUNITY_Shared Types & Locale]]
- 1 edge to [[_COMMUNITY_Messaging Service]]

## Top bridge nodes
- [[auth.controller.ts]] - degree 34, connects to 6 communities
- [[tenant.service.ts]] - degree 13, connects to 4 communities
- [[students.ts]] - degree 27, connects to 3 communities
- [[tutorRequest.service.ts]] - degree 16, connects to 3 communities
- [[adminUserRole.service.ts]] - degree 13, connects to 3 communities