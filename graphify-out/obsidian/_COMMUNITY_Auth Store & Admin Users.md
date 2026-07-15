---
type: community
cohesion: 0.25
members: 9
---

# Auth Store & Admin Users

**Cohesion:** 0.25 - loosely connected
**Members:** 9 nodes

## Members
- [[AdminUserDetail]] - code - packages/types/index.ts
- [[AdminUserListItem]] - code - packages/types/index.ts
- [[AuthState]] - code - apps/admin/store/useAuthStore.ts
- [[AuthState_1]] - code - apps/web/store/useAuthStore.ts
- [[User]] - code - packages/types/index.ts
- [[useAuthStore]] - code - apps/admin/store/useAuthStore.ts
- [[useAuthStore_1]] - code - apps/web/store/useAuthStore.ts
- [[useAuthStore.ts]] - code - apps/admin/store/useAuthStore.ts
- [[useAuthStore.ts_1]] - code - apps/web/store/useAuthStore.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Auth_Store__Admin_Users
SORT file.name ASC
```

## Connections to other communities
- 5 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 2 edges to [[_COMMUNITY_Admin Content Page]]
- 1 edge to [[_COMMUNITY_Become Tutor & Auth Shell]]
- 1 edge to [[_COMMUNITY_Global Providers & Upgrade Modal]]
- 1 edge to [[_COMMUNITY_Billing & Profile UI]]
- 1 edge to [[_COMMUNITY_Tenant Billing Page]]
- 1 edge to [[_COMMUNITY_Flashcards Page]]

## Top bridge nodes
- [[User]] - degree 10, connects to 6 communities
- [[AdminUserListItem]] - degree 4, connects to 2 communities
- [[AdminUserDetail]] - degree 3, connects to 2 communities
- [[useAuthStore.ts]] - degree 4, connects to 1 community
- [[useAuthStore.ts_1]] - degree 4, connects to 1 community