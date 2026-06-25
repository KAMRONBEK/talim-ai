---
type: community
cohesion: 0.29
members: 12
---

# Tenant-Owner Bootstrap & Role Service

**Cohesion:** 0.29 - loosely connected
**Members:** 12 nodes

## Members
- [[AdminRoleChangeInput]] - code - apps/api/src/services/adminUserRole.service.ts
- [[adminUpdateTenantSubscription()]] - code - apps/api/src/services/subscription/tenant.ts
- [[adminUserRole.service.ts]] - code - apps/api/src/services/adminUserRole.service.ts
- [[applyAdminRoleChange()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[create-tenant-owner.ts]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[createTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[ensureIndividualSubscription()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[ensureTenantSubscription()]] - code - apps/api/src/services/tenant/organization.ts
- [[getDefaultTenantPlanId()]] - code - apps/api/src/services/tenant/shared.ts
- [[main()_2]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[parseArgs()_1]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[transferTenantOwnership()]] - code - apps/api/src/services/adminUserRole.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant-Owner_Bootstrap__Role_Service
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_Tenant Service & Content Assignment]]
- 4 edges to [[_COMMUNITY_AI Summary Generation]]
- 3 edges to [[_COMMUNITY_Admin Audit & Content Controller]]
- 3 edges to [[_COMMUNITY_Subscription Service]]
- 3 edges to [[_COMMUNITY_Auth Controller (loginjoinpassword)]]
- 2 edges to [[_COMMUNITY_Admin Tenants Controller]]
- 2 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]

## Top bridge nodes
- [[adminUserRole.service.ts]] - degree 13, connects to 5 communities
- [[create-tenant-owner.ts]] - degree 8, connects to 3 communities
- [[applyAdminRoleChange()]] - degree 9, connects to 2 communities
- [[adminUpdateTenantSubscription()]] - degree 6, connects to 2 communities
- [[createTenantForOwner()]] - degree 8, connects to 1 community