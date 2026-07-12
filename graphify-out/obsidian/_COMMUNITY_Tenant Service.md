---
type: community
cohesion: 0.18
members: 20
---

# Tenant Service

**Cohesion:** 0.18 - loosely connected
**Members:** 20 nodes

## Members
- [[assignContent()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[assignmentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[assignments.ts]] - code - apps/api/src/services/tenant/assignments.ts
- [[createStudentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[formatTenant()]] - code - apps/api/src/services/tenant/shared.ts
- [[generateUniqueJoinCode()]] - code - apps/api/src/services/tenant/shared.ts
- [[getTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[listContentAssignments()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[organization.ts]] - code - apps/api/src/services/tenant/organization.ts
- [[patchStudentSchema]] - code - apps/api/src/services/tenant/shared.ts
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
TABLE source_file, type FROM #community/Tenant_Service
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_Billing, Usage & Limits]]
- 6 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 6 edges to [[_COMMUNITY_Community 117]]
- 5 edges to [[_COMMUNITY_Student Provisioning & CSV]]
- 4 edges to [[_COMMUNITY_Admin Content & Audit]]
- 2 edges to [[_COMMUNITY_Auth API Controller]]
- 2 edges to [[_COMMUNITY_Community 85]]
- 1 edge to [[_COMMUNITY_Assessment & Tutor-Request Controllers]]
- 1 edge to [[_COMMUNITY_Tenant Owner Controller]]
- 1 edge to [[_COMMUNITY_Tenant Messaging Service]]
- 1 edge to [[_COMMUNITY_Learning Coverage & Badges]]

## Top bridge nodes
- [[tenant.service.ts]] - degree 13, connects to 9 communities
- [[organization.ts]] - degree 19, connects to 5 communities
- [[shared.ts_3]] - degree 20, connects to 4 communities
- [[assignments.ts]] - degree 10, connects to 2 communities
- [[formatTenant()]] - degree 9, connects to 1 community