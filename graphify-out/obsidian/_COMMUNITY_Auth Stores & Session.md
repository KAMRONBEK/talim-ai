---
type: community
cohesion: 0.20
members: 11
---

# Auth Stores & Session

**Cohesion:** 0.20 - loosely connected
**Members:** 11 nodes

## Members
- [[AdminUserDetail]] - code - packages/types/index.ts
- [[AdminUserListItem]] - code - packages/types/index.ts
- [[AuthState]] - code - apps/admin/store/useAuthStore.ts
- [[AuthState_1]] - code - apps/web/store/useAuthStore.ts
- [[SessionSync()]] - code - apps/web/components/session-sync.tsx
- [[User]] - code - packages/types/index.ts
- [[session-sync.tsx]] - code - apps/web/components/session-sync.tsx
- [[useAuthStore]] - code - apps/admin/store/useAuthStore.ts
- [[useAuthStore_1]] - code - apps/web/store/useAuthStore.ts
- [[useAuthStore.ts]] - code - apps/admin/store/useAuthStore.ts
- [[useAuthStore.ts_1]] - code - apps/web/store/useAuthStore.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Auth_Stores__Session
SORT file.name ASC
```

## Connections to other communities
- 6 edges to [[_COMMUNITY_Shared Types & Locale]]
- 2 edges to [[_COMMUNITY_Admin Data Hooks]]
- 2 edges to [[_COMMUNITY_Providers & Job Events]]
- 1 edge to [[_COMMUNITY_Auth Pages & Routing]]
- 1 edge to [[_COMMUNITY_Tenant Pages & Billing UI]]
- 1 edge to [[_COMMUNITY_App Shells & Navigation]]
- 1 edge to [[_COMMUNITY_Content Stage & Limits]]

## Top bridge nodes
- [[User]] - degree 10, connects to 5 communities
- [[session-sync.tsx]] - degree 4, connects to 2 communities
- [[AdminUserListItem]] - degree 4, connects to 2 communities
- [[AdminUserDetail]] - degree 3, connects to 2 communities
- [[useAuthStore.ts]] - degree 4, connects to 1 community