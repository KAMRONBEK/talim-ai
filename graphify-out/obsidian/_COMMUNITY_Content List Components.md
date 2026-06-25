---
type: community
cohesion: 0.24
members: 10
---

# Content List Components

**Cohesion:** 0.24 - loosely connected
**Members:** 10 nodes

## Members
- [[Content]] - code - packages/types/index.ts
- [[ContentList()]] - code - apps/web/components/content/ContentList.tsx
- [[ContentList.tsx]] - code - apps/web/components/content/ContentList.tsx
- [[ContentListProps]] - code - apps/web/components/content/ContentList.tsx
- [[ContentStageProps]] - code - apps/web/components/learning/content-stage.tsx
- [[ContentState]] - code - apps/web/store/useContentStore.ts
- [[RecentContentGridProps]] - code - apps/web/components/dashboard/recent-content-grid.tsx
- [[statusColors]] - code - apps/web/components/content/ContentList.tsx
- [[useContentStore]] - code - apps/web/store/useContentStore.ts
- [[useContentStore.ts]] - code - apps/web/store/useContentStore.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Content_List_Components
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 3 edges to [[_COMMUNITY_Content Status & Processing UI]]
- 2 edges to [[_COMMUNITY_Admin Login & Audit Pages]]
- 2 edges to [[_COMMUNITY_Shared UI Primitives (@talimui)]]
- 2 edges to [[_COMMUNITY_Recent Content Grid UI]]
- 2 edges to [[_COMMUNITY_Content Stage & PDF Excerpt]]
- 2 edges to [[_COMMUNITY_Tenant Dashboard UI]]
- 1 edge to [[_COMMUNITY_Admin Dashboard UI]]
- 1 edge to [[_COMMUNITY_Auth Guard & App Shell]]

## Top bridge nodes
- [[Content]] - degree 14, connects to 5 communities
- [[ContentList.tsx]] - degree 11, connects to 5 communities
- [[useContentStore.ts]] - degree 4, connects to 1 community
- [[RecentContentGridProps]] - degree 2, connects to 1 community
- [[ContentStageProps]] - degree 2, connects to 1 community