---
type: community
cohesion: 0.15
members: 23
---

# Content Query Hooks

**Cohesion:** 0.15 - loosely connected
**Members:** 23 nodes

## Members
- [[Content]] - code - packages/types/index.ts
- [[ContentListProps]] - code - apps/web/components/content/ContentList.tsx
- [[ContentStageProps]] - code - apps/web/components/learning/content-stage.tsx
- [[ContentState]] - code - apps/web/store/useContentStore.ts
- [[ContentStatusGateProps]] - code - apps/web/components/content/content-status-gate.tsx
- [[LIST_KEYS]] - code - apps/web/lib/content-cache.ts
- [[ListSnapshot]] - code - apps/web/lib/content-cache.ts
- [[RecentContentGridProps]] - code - apps/web/components/dashboard/recent-content-grid.tsx
- [[content-cache.ts]] - code - apps/web/lib/content-cache.ts
- [[contentApiBase()]] - code - apps/web/hooks/useContent.ts
- [[invalidateContentLists()]] - code - apps/web/lib/content-cache.ts
- [[listHasProcessing()]] - code - apps/web/lib/content-cache.ts
- [[prependContentToLists()]] - code - apps/web/lib/content-cache.ts
- [[removeContentFromLists()]] - code - apps/web/lib/content-cache.ts
- [[restoreContentLists()]] - code - apps/web/lib/content-cache.ts
- [[snapshotContentLists()]] - code - apps/web/lib/content-cache.ts
- [[useContent.ts]] - code - apps/web/hooks/useContent.ts
- [[useContentStore]] - code - apps/web/store/useContentStore.ts
- [[useContentStore.ts]] - code - apps/web/store/useContentStore.ts
- [[useDeleteTenantContent()]] - code - apps/web/hooks/useTenantContent.ts
- [[useRetryContent()_1]] - code - apps/web/hooks/useContent.ts
- [[useRetryTenantContent()]] - code - apps/web/hooks/useTenantContent.ts
- [[useTenantContent.ts]] - code - apps/web/hooks/useTenantContent.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Content_Query_Hooks
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_Dialog Components]]
- 7 edges to [[_COMMUNITY_Auth & Assignment UI]]
- 7 edges to [[_COMMUNITY_Content Detail Page]]
- 6 edges to [[_COMMUNITY_Learner Dashboard]]
- 6 edges to [[_COMMUNITY_Tenant Dashboard & Hooks]]
- 5 edges to [[_COMMUNITY_Web API Client & Endpoints]]
- 5 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 4 edges to [[_COMMUNITY_Shared UI Primitives]]
- 4 edges to [[_COMMUNITY_Web Providers & Job-Event Stream]]
- 3 edges to [[_COMMUNITY_Dashboard Search]]
- 2 edges to [[_COMMUNITY_Locale Sync & Content Hooks]]
- 1 edge to [[_COMMUNITY_Tenant Assessment Builder UI]]
- 1 edge to [[_COMMUNITY_Flashcards UI]]
- 1 edge to [[_COMMUNITY_Upgrade Modal & Chat Window]]
- 1 edge to [[_COMMUNITY_Quiz Player UI]]
- 1 edge to [[_COMMUNITY_Sheet & Layout Components]]

## Top bridge nodes
- [[useContent.ts]] - degree 35, connects to 13 communities
- [[Content]] - degree 17, connects to 7 communities
- [[useTenantContent.ts]] - degree 25, connects to 6 communities
- [[contentApiBase()]] - degree 5, connects to 3 communities
- [[content-cache.ts]] - degree 13, connects to 2 communities