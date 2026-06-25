---
type: community
cohesion: 0.15
members: 22
---

# Admin Content & Users UI

**Cohesion:** 0.15 - loosely connected
**Members:** 22 nodes

## Members
- [[AdminAuditLogItem]] - code - packages/types/index.ts
- [[AdminContentItem]] - code - packages/types/index.ts
- [[AdminGeneratedItem]] - code - packages/types/index.ts
- [[AdminPatchUserInput]] - code - packages/types/index.ts
- [[AdminPlatformStats]] - code - packages/types/index.ts
- [[AdminSubscriptionListItem]] - code - packages/types/index.ts
- [[AdminUpdateSubscriptionInput]] - code - packages/types/index.ts
- [[AdminUsageSummaryRow]] - code - packages/types/index.ts
- [[AdminUserDetail]] - code - packages/types/index.ts
- [[AdminUserListItem]] - code - packages/types/index.ts
- [[ContentPage()]] - code - apps/admin/app/(admin)/content/page.tsx
- [[PaginatedResponse]] - code - packages/types/index.ts
- [[UsersPage()]] - code - apps/admin/app/(admin)/users/page.tsx
- [[page.tsx_1]] - code - apps/admin/app/(admin)/content/page.tsx
- [[page.tsx_10]] - code - apps/admin/app/(admin)/users/page.tsx
- [[useAdmin.ts]] - code - apps/admin/hooks/useAdmin.ts
- [[useAdminContents()]] - code - apps/admin/hooks/useAdmin.ts
- [[useAdminUsers()]] - code - apps/admin/hooks/useAdmin.ts
- [[useDeleteContent()]] - code - apps/admin/hooks/useAdmin.ts
- [[useDeleteUser()]] - code - apps/admin/hooks/useAdmin.ts
- [[useResetUserPassword()]] - code - apps/admin/hooks/useAdmin.ts
- [[useRetryContent()]] - code - apps/admin/hooks/useAdmin.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Content__Users_UI
SORT file.name ASC
```

## Connections to other communities
- 16 edges to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 11 edges to [[_COMMUNITY_Admin TenantUser Detail UI]]
- 6 edges to [[_COMMUNITY_Admin Generated & Usage UI]]
- 4 edges to [[_COMMUNITY_Admin Login & Audit Pages]]
- 4 edges to [[_COMMUNITY_Admin Tutor-Requests UI]]
- 2 edges to [[_COMMUNITY_Shared UI Primitives (@talimui)]]
- 2 edges to [[_COMMUNITY_Admin Dashboard UI]]
- 2 edges to [[_COMMUNITY_Admin Subscriptions UI]]
- 2 edges to [[_COMMUNITY_Tenant Detail UI]]
- 1 edge to [[_COMMUNITY_Auth Store (Zustand)]]
- 1 edge to [[_COMMUNITY_TTS Normalization Service]]

## Top bridge nodes
- [[useAdmin.ts]] - degree 49, connects to 8 communities
- [[page.tsx_1]] - degree 8, connects to 3 communities
- [[page.tsx_10]] - degree 8, connects to 3 communities
- [[AdminUserListItem]] - degree 4, connects to 2 communities
- [[AdminPatchUserInput]] - degree 3, connects to 2 communities