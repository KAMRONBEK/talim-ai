---
type: community
cohesion: 0.25
members: 9
---

# Admin Auth Store

**Cohesion:** 0.25 - loosely connected
**Members:** 9 nodes

## Members
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
TABLE source_file, type FROM #community/Admin_Auth_Store
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 2 edges to [[_COMMUNITY_Billing & Access Guards]]
- 2 edges to [[_COMMUNITY_Web Providers & Job-Event Stream]]
- 1 edge to [[_COMMUNITY_Shared UI Primitives]]
- 1 edge to [[_COMMUNITY_Admin Dashboard & Charts]]
- 1 edge to [[_COMMUNITY_Flashcards UI]]

## Top bridge nodes
- [[User]] - degree 10, connects to 5 communities
- [[session-sync.tsx]] - degree 4, connects to 2 communities
- [[useAuthStore.ts]] - degree 4, connects to 1 community
- [[useAuthStore.ts_1]] - degree 4, connects to 1 community
- [[SessionSync()]] - degree 2, connects to 1 community