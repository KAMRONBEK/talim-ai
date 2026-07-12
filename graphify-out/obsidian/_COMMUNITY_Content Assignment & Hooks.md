---
type: community
cohesion: 0.12
members: 32
---

# Content Assignment & Hooks

**Cohesion:** 0.12 - loosely connected
**Members:** 32 nodes

## Members
- [[AssignContentPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/materials/[id]/assign/page.tsx
- [[Content]] - code - packages/types/index.ts
- [[ContentState]] - code - apps/web/store/useContentStore.ts
- [[ContentStatusGate()]] - code - apps/web/components/content/content-status-gate.tsx
- [[ContentStatusGateProps]] - code - apps/web/components/content/content-status-gate.tsx
- [[DeleteContentDialog()]] - code - apps/web/components/content/delete-content-dialog.tsx
- [[JobStreamState]] - code - apps/web/store/useJobStreamStore.ts
- [[LIST_KEYS]] - code - apps/web/lib/content-cache.ts
- [[ListSnapshot]] - code - apps/web/lib/content-cache.ts
- [[ProcessingCard()]] - code - apps/web/components/content/content-status-gate.tsx
- [[RecentContentGridProps]] - code - apps/web/components/dashboard/recent-content-grid.tsx
- [[content-cache.ts]] - code - apps/web/lib/content-cache.ts
- [[content-status-gate.tsx]] - code - apps/web/components/content/content-status-gate.tsx
- [[contentApiBase()]] - code - apps/web/hooks/useContent.ts
- [[invalidateContentLists()]] - code - apps/web/lib/content-cache.ts
- [[listHasProcessing()]] - code - apps/web/lib/content-cache.ts
- [[page.tsx_22]] - code - apps/web/app/[locale]/(tenant)/tenant/materials/[id]/assign/page.tsx
- [[prependContentToLists()]] - code - apps/web/lib/content-cache.ts
- [[removeContentFromLists()]] - code - apps/web/lib/content-cache.ts
- [[restoreContentLists()]] - code - apps/web/lib/content-cache.ts
- [[snapshotContentLists()]] - code - apps/web/lib/content-cache.ts
- [[useContent.ts]] - code - apps/web/hooks/useContent.ts
- [[useContentStore]] - code - apps/web/store/useContentStore.ts
- [[useContentStore.ts]] - code - apps/web/store/useContentStore.ts
- [[useDeleteContent()_1]] - code - apps/web/hooks/useContent.ts
- [[useDeleteTenantContent()]] - code - apps/web/hooks/useTenantContent.ts
- [[useJobStreamStore]] - code - apps/web/store/useJobStreamStore.ts
- [[useJobStreamStore.ts]] - code - apps/web/store/useJobStreamStore.ts
- [[useRetryContent()_1]] - code - apps/web/hooks/useContent.ts
- [[useRetryTenantContent()]] - code - apps/web/hooks/useTenantContent.ts
- [[useTenantContent()]] - code - apps/web/hooks/useTenantContent.ts
- [[useTenantContent.ts]] - code - apps/web/hooks/useTenantContent.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Content_Assignment__Hooks
SORT file.name ASC
```

## Connections to other communities
- 21 edges to [[_COMMUNITY_Content & Flashcards Hooks]]
- 10 edges to [[_COMMUNITY_Account & Settings UI]]
- 10 edges to [[_COMMUNITY_Dialog & Button UI]]
- 8 edges to [[_COMMUNITY_B2C Dashboard Shell]]
- 7 edges to [[_COMMUNITY_Content Grid & Learner Dashboard]]
- 6 edges to [[_COMMUNITY_Shared Types & Auth Stores]]
- 5 edges to [[_COMMUNITY_Shared UI Primitives]]
- 4 edges to [[_COMMUNITY_Auth & App Shell UI]]
- 4 edges to [[_COMMUNITY_Content Workspace & Chat]]
- 4 edges to [[_COMMUNITY_Quiz Player & Hooks]]
- 3 edges to [[_COMMUNITY_API Endpoints & Media Hooks]]
- 3 edges to [[_COMMUNITY_Providers & Job Events]]
- 1 edge to [[_COMMUNITY_Learner Account & Onboarding]]
- 1 edge to [[_COMMUNITY_Assessment Pages & Wizard]]
- 1 edge to [[_COMMUNITY_Slide Deck UI]]

## Top bridge nodes
- [[useContent.ts]] - degree 35, connects to 11 communities
- [[content-status-gate.tsx]] - degree 14, connects to 7 communities
- [[useTenantContent.ts]] - degree 25, connects to 5 communities
- [[useJobStreamStore]] - degree 17, connects to 5 communities
- [[Content]] - degree 16, connects to 5 communities