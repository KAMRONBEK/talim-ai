---
type: community
cohesion: 0.43
members: 8
---

# Admin Role Management

**Cohesion:** 0.43 - moderately connected
**Members:** 8 nodes

## Members
- [[AdminRoleChangeInput]] - code - apps/api/src/services/adminUserRole.service.ts
- [[adminUserRole.service.ts]] - code - apps/api/src/services/adminUserRole.service.ts
- [[applyAdminRoleChange()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[createTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[ensureIndividualSubscription()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[ensureTenantSubscription()]] - code - apps/api/src/services/tenant/organization.ts
- [[getDefaultTenantPlanId()]] - code - apps/api/src/services/tenant/shared.ts
- [[transferTenantOwnership()]] - code - apps/api/src/services/adminUserRole.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Role_Management
SORT file.name ASC
```

## Connections to other communities
- 7 edges to [[_COMMUNITY_Tenant Service & Assignments]]
- 5 edges to [[_COMMUNITY_Audit & Content Management]]
- 3 edges to [[_COMMUNITY_Auth Controller]]
- 2 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 2 edges to [[_COMMUNITY_Billing & Quota Errors]]

## Top bridge nodes
- [[adminUserRole.service.ts]] - degree 13, connects to 5 communities
- [[applyAdminRoleChange()]] - degree 9, connects to 2 communities
- [[createTenantForOwner()]] - degree 8, connects to 2 communities
- [[ensureTenantSubscription()]] - degree 4, connects to 1 community
- [[getDefaultTenantPlanId()]] - degree 4, connects to 1 community