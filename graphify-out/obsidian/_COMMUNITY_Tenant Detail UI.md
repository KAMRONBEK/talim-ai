---
type: community
cohesion: 0.38
members: 7
---

# Tenant Detail UI

**Cohesion:** 0.38 - loosely connected
**Members:** 7 nodes

## Members
- [[STATUS_OPTIONS_1]] - code - apps/admin/app/(admin)/tenants/[id]/page.tsx
- [[SubscriptionStatus]] - code - packages/types/index.ts
- [[TENANT_PLANS]] - code - apps/admin/app/(admin)/tenants/[id]/page.tsx
- [[TenantDetailPage()]] - code - apps/admin/app/(admin)/tenants/[id]/page.tsx
- [[formatLimit()]] - code - apps/admin/app/(admin)/tenants/[id]/page.tsx
- [[page.tsx_5]] - code - apps/admin/app/(admin)/tenants/[id]/page.tsx
- [[useUpdateTenant()]] - code - apps/admin/hooks/useAdmin.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant_Detail_UI
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_Admin Login & Audit Pages]]
- 3 edges to [[_COMMUNITY_Admin TenantUser Detail UI]]
- 2 edges to [[_COMMUNITY_Admin Content & Users UI]]
- 2 edges to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 1 edge to [[_COMMUNITY_Admin Generated & Usage UI]]
- 1 edge to [[_COMMUNITY_Admin Dashboard UI]]
- 1 edge to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 1 edge to [[_COMMUNITY_Shared UI Primitives (@talimui)]]

## Top bridge nodes
- [[page.tsx_5]] - degree 17, connects to 8 communities
- [[SubscriptionStatus]] - degree 3, connects to 2 communities
- [[TenantDetailPage()]] - degree 4, connects to 1 community
- [[useUpdateTenant()]] - degree 3, connects to 1 community