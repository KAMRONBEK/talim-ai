---
type: community
cohesion: 0.22
members: 18
---

# Tenant Service & Assignments

**Cohesion:** 0.22 - loosely connected
**Members:** 18 nodes

## Members
- [[assignContent()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[assignmentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[assignments.ts]] - code - apps/api/src/services/tenant/assignments.ts
- [[formatTenant()]] - code - apps/api/src/services/tenant/shared.ts
- [[generateUniqueJoinCode()]] - code - apps/api/src/services/tenant/shared.ts
- [[getTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[listContentAssignments()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[organization.ts]] - code - apps/api/src/services/tenant/organization.ts
- [[patchTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[patchTenantSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[randomJoinCode()]] - code - apps/api/src/services/tenant/shared.ts
- [[regenerateJoinCode()_1]] - code - apps/api/src/services/tenant/organization.ts
- [[shared.ts_3]] - code - apps/api/src/services/tenant/shared.ts
- [[slugifyOrgName()]] - code - apps/api/src/lib/tenant-slug.ts
- [[tenant-slug.ts]] - code - apps/api/src/lib/tenant-slug.ts
- [[tenant.service.ts]] - code - apps/api/src/services/tenant.service.ts
- [[unassignContent()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[uniqueSlug()]] - code - apps/api/src/services/tenant/shared.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant_Service__Assignments
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 7 edges to [[_COMMUNITY_Admin Role Management]]
- 6 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 5 edges to [[_COMMUNITY_Student Import Service]]
- 4 edges to [[_COMMUNITY_Audit & Content Management]]
- 2 edges to [[_COMMUNITY_Auth Controller]]
- 1 edge to [[_COMMUNITY_Learner API Controller]]
- 1 edge to [[_COMMUNITY_Tenant Student Management]]
- 1 edge to [[_COMMUNITY_Tenant Messaging Service]]
- 1 edge to [[_COMMUNITY_Learning Coverage & Badges]]

## Top bridge nodes
- [[tenant.service.ts]] - degree 13, connects to 8 communities
- [[shared.ts_3]] - degree 20, connects to 4 communities
- [[organization.ts]] - degree 19, connects to 4 communities
- [[assignments.ts]] - degree 10, connects to 2 communities
- [[formatTenant()]] - degree 9, connects to 2 communities