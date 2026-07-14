---
type: community
cohesion: 0.17
members: 26
---

# Tenant Org & Roles Service

**Cohesion:** 0.17 - loosely connected
**Members:** 26 nodes

## Members
- [[AdminRoleChangeInput]] - code - apps/api/src/services/adminUserRole.service.ts
- [[adminUpdateTenantSubscription()]] - code - apps/api/src/services/subscription/tenant.ts
- [[adminUserRole.service.ts]] - code - apps/api/src/services/adminUserRole.service.ts
- [[applyAdminRoleChange()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[create-tenant-owner.ts]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[createTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[ensureIndividualSubscription()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[ensureTenantSubscription()]] - code - apps/api/src/services/tenant/organization.ts
- [[formatTenant()]] - code - apps/api/src/services/tenant/shared.ts
- [[generateUniqueJoinCode()]] - code - apps/api/src/services/tenant/shared.ts
- [[getDefaultTenantPlanId()]] - code - apps/api/src/services/tenant/shared.ts
- [[getTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[main()_2]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[organization.ts]] - code - apps/api/src/services/tenant/organization.ts
- [[parseArgs()_1]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[patchTenant()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[patchTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[patchTenantSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[randomJoinCode()]] - code - apps/api/src/services/tenant/shared.ts
- [[regenerateJoinCode()_1]] - code - apps/api/src/services/tenant/organization.ts
- [[shared.ts_3]] - code - apps/api/src/services/tenant/shared.ts
- [[slugifyOrgName()]] - code - apps/api/src/lib/tenant-slug.ts
- [[tenant-slug.ts]] - code - apps/api/src/lib/tenant-slug.ts
- [[tenant.service.ts]] - code - apps/api/src/services/tenant.service.ts
- [[transferTenantOwnership()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[uniqueSlug()]] - code - apps/api/src/services/tenant/shared.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant_Org__Roles_Service
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 9 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 8 edges to [[_COMMUNITY_Admin Content & Audit Controllers]]
- 7 edges to [[_COMMUNITY_Subscription & Billing Service]]
- 5 edges to [[_COMMUNITY_Auth Controller]]
- 5 edges to [[_COMMUNITY_Student Management Service]]
- 2 edges to [[_COMMUNITY_Learner Controller]]
- 1 edge to [[_COMMUNITY_Assessment Controller]]
- 1 edge to [[_COMMUNITY_Tenant Messaging Service]]

## Top bridge nodes
- [[tenant.service.ts]] - degree 13, connects to 7 communities
- [[organization.ts]] - degree 19, connects to 4 communities
- [[adminUserRole.service.ts]] - degree 13, connects to 4 communities
- [[shared.ts_3]] - degree 20, connects to 3 communities
- [[patchTenant()]] - degree 6, connects to 3 communities