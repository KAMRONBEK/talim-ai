---
type: community
cohesion: 0.14
members: 28
---

# Tenant Service & Content Assignment

**Cohesion:** 0.14 - loosely connected
**Members:** 28 nodes

## Members
- [[assertTenantQuota()]] - code - apps/api/src/services/subscription/tenant.ts
- [[assignContent()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[assignmentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[assignments.ts]] - code - apps/api/src/services/tenant/assignments.ts
- [[createStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[createStudentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[deleteStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[formatStudentRow()]] - code - apps/api/src/services/tenant/shared.ts
- [[formatTenant()]] - code - apps/api/src/services/tenant/shared.ts
- [[generateUniqueJoinCode()]] - code - apps/api/src/services/tenant/shared.ts
- [[getTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[listContentAssignments()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[organization.ts]] - code - apps/api/src/services/tenant/organization.ts
- [[patchStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[patchStudentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[patchTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[patchTenantSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[randomJoinCode()]] - code - apps/api/src/services/tenant/shared.ts
- [[regenerateJoinCode()_1]] - code - apps/api/src/services/tenant/organization.ts
- [[resetStudentPassword()_1]] - code - apps/api/src/services/tenant/students.ts
- [[resolveTenantUpgradePlanCode()]] - code - apps/api/src/services/subscription/tenant.ts
- [[shared.ts_3]] - code - apps/api/src/services/tenant/shared.ts
- [[slugifyOrgName()]] - code - apps/api/src/lib/tenant-slug.ts
- [[students.ts]] - code - apps/api/src/services/tenant/students.ts
- [[tenant-slug.ts]] - code - apps/api/src/lib/tenant-slug.ts
- [[tenant.service.ts]] - code - apps/api/src/services/tenant.service.ts
- [[unassignContent()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[uniqueSlug()]] - code - apps/api/src/services/tenant/shared.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant_Service__Content_Assignment
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 8 edges to [[_COMMUNITY_Admin Tenants Controller]]
- 8 edges to [[_COMMUNITY_AI Summary Generation]]
- 8 edges to [[_COMMUNITY_Tenant-Owner Bootstrap & Role Service]]
- 6 edges to [[_COMMUNITY_Subscription Service]]
- 3 edges to [[_COMMUNITY_Auth Controller (loginjoinpassword)]]
- 3 edges to [[_COMMUNITY_Learning Progress & Coverage Scoring]]
- 1 edge to [[_COMMUNITY_Tenant Controller (studentsprogress)]]
- 1 edge to [[_COMMUNITY_Podcast & Progress Controllers]]

## Top bridge nodes
- [[tenant.service.ts]] - degree 12, connects to 6 communities
- [[organization.ts]] - degree 19, connects to 5 communities
- [[students.ts]] - degree 17, connects to 4 communities
- [[assertTenantQuota()]] - degree 14, connects to 4 communities
- [[shared.ts_3]] - degree 20, connects to 3 communities