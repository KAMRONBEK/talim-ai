---
type: community
cohesion: 0.20
members: 16
---

# Admin Tenant/User Detail UI

**Cohesion:** 0.20 - loosely connected
**Members:** 16 nodes

## Members
- [[AdminTenantUsageVsLimits]] - code - packages/types/index.ts
- [[AdminUsageVsLimits]] - code - packages/types/index.ts
- [[INDIVIDUAL_PLANS]] - code - apps/admin/app/(admin)/users/[id]/page.tsx
- [[ROLE_OPTIONS]] - code - apps/admin/app/(admin)/users/[id]/page.tsx
- [[STATUS_OPTIONS_2]] - code - apps/admin/app/(admin)/users/[id]/page.tsx
- [[TenantsPage()]] - code - apps/admin/app/(admin)/tenants/page.tsx
- [[UserDetailPage()]] - code - apps/admin/app/(admin)/users/[id]/page.tsx
- [[formatLimit()_1]] - code - apps/admin/app/(admin)/users/[id]/page.tsx
- [[isTenantUsage()]] - code - apps/admin/app/(admin)/users/[id]/page.tsx
- [[page.tsx_9]] - code - apps/admin/app/(admin)/users/[id]/page.tsx
- [[page.tsx_6]] - code - apps/admin/app/(admin)/tenants/page.tsx
- [[useAdminTenant()]] - code - apps/admin/hooks/useAdmin.ts
- [[useAdminTenants()]] - code - apps/admin/hooks/useAdmin.ts
- [[useAdminUser()]] - code - apps/admin/hooks/useAdmin.ts
- [[usePatchUser()]] - code - apps/admin/hooks/useAdmin.ts
- [[useUpdateUserSubscription()]] - code - apps/admin/hooks/useAdmin.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Tenant/User_Detail_UI
SORT file.name ASC
```

## Connections to other communities
- 11 edges to [[_COMMUNITY_Admin Content & Users UI]]
- 5 edges to [[_COMMUNITY_Admin Login & Audit Pages]]
- 3 edges to [[_COMMUNITY_Tenant Detail UI]]
- 3 edges to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 2 edges to [[_COMMUNITY_Admin Generated & Usage UI]]
- 2 edges to [[_COMMUNITY_Shared UI Primitives (@talimui)]]
- 1 edge to [[_COMMUNITY_Admin Dashboard UI]]
- 1 edge to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 1 edge to [[_COMMUNITY_Content Status & Processing UI]]

## Top bridge nodes
- [[page.tsx_9]] - degree 26, connects to 9 communities
- [[page.tsx_6]] - degree 6, connects to 4 communities
- [[useAdminTenant()]] - degree 5, connects to 2 communities
- [[AdminTenantUsageVsLimits]] - degree 4, connects to 2 communities
- [[AdminUsageVsLimits]] - degree 4, connects to 2 communities