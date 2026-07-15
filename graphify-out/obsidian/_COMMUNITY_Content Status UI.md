---
type: community
cohesion: 0.12
members: 34
---

# Content Status UI

**Cohesion:** 0.12 - loosely connected
**Members:** 34 nodes

## Members
- [[Content]] - code - packages/types/index.ts
- [[ContentStatusGate()]] - code - apps/web/components/content/content-status-gate.tsx
- [[ContentStatusGateProps]] - code - apps/web/components/content/content-status-gate.tsx
- [[ContentThumbnail()]] - code - apps/web/components/dashboard/recent-content-grid.tsx
- [[DeleteContentDialog()]] - code - apps/web/components/content/delete-content-dialog.tsx
- [[LIST_KEYS]] - code - apps/web/lib/content-cache.ts
- [[ListSnapshot]] - code - apps/web/lib/content-cache.ts
- [[ProcessingCard()]] - code - apps/web/components/content/content-status-gate.tsx
- [[RecentContentGrid()]] - code - apps/web/components/dashboard/recent-content-grid.tsx
- [[RecentContentGridProps]] - code - apps/web/components/dashboard/recent-content-grid.tsx
- [[TypeBadge()]] - code - apps/web/components/dashboard/recent-content-grid.tsx
- [[VideoTutorialViewer()]] - code - apps/web/components/learning/VideoTutorialViewer.tsx
- [[content-cache.ts]] - code - apps/web/lib/content-cache.ts
- [[content-status-gate.tsx]] - code - apps/web/components/content/content-status-gate.tsx
- [[contentApiBase()]] - code - apps/web/hooks/useContent.ts
- [[getYoutubeThumbnailUrl()]] - code - apps/web/lib/youtube.ts
- [[getYoutubeVideoId()]] - code - apps/web/lib/youtube.ts
- [[invalidateContentLists()]] - code - apps/web/lib/content-cache.ts
- [[listHasProcessing()]] - code - apps/web/lib/content-cache.ts
- [[prependContentToLists()]] - code - apps/web/lib/content-cache.ts
- [[recent-content-grid.tsx]] - code - apps/web/components/dashboard/recent-content-grid.tsx
- [[removeContentFromLists()]] - code - apps/web/lib/content-cache.ts
- [[restoreContentLists()]] - code - apps/web/lib/content-cache.ts
- [[snapshotContentLists()]] - code - apps/web/lib/content-cache.ts
- [[typeLabelKey]] - code - apps/web/components/dashboard/recent-content-grid.tsx
- [[typeStyles_1]] - code - apps/web/components/dashboard/recent-content-grid.tsx
- [[useContent.ts]] - code - apps/web/hooks/useContent.ts
- [[useDeleteContent()_1]] - code - apps/web/hooks/useContent.ts
- [[useDeleteTenantContent()]] - code - apps/web/hooks/useTenantContent.ts
- [[useReparseContent.ts]] - code - apps/web/hooks/useReparseContent.ts
- [[useRetryContent()_1]] - code - apps/web/hooks/useContent.ts
- [[useRetryTenantContent()]] - code - apps/web/hooks/useTenantContent.ts
- [[useTenantContent.ts]] - code - apps/web/hooks/useTenantContent.ts
- [[youtube.ts]] - code - apps/web/lib/youtube.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Content_Status_UI
SORT file.name ASC
```

## Connections to other communities
- 20 edges to [[_COMMUNITY_Flashcards Page]]
- 18 edges to [[_COMMUNITY_Login & Assign Content]]
- 15 edges to [[_COMMUNITY_Billing & Profile UI]]
- 11 edges to [[_COMMUNITY_Learner Dashboard]]
- 8 edges to [[_COMMUNITY_API Endpoints & Chat UI]]
- 7 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 6 edges to [[_COMMUNITY_Tenant Billing Page]]
- 4 edges to [[_COMMUNITY_Become Tutor & Auth Shell]]
- 3 edges to [[_COMMUNITY_Transcript Panel & Video Viewer]]
- 2 edges to [[_COMMUNITY_Relative Time Utilities]]
- 2 edges to [[_COMMUNITY_PDF Text Extraction]]
- 1 edge to [[_COMMUNITY_Tenant Assessments Page]]
- 1 edge to [[_COMMUNITY_Quiz Page & Hooks]]

## Top bridge nodes
- [[useContent.ts]] - degree 35, connects to 8 communities
- [[recent-content-grid.tsx]] - degree 24, connects to 7 communities
- [[useTenantContent.ts]] - degree 25, connects to 5 communities
- [[content-status-gate.tsx]] - degree 14, connects to 5 communities
- [[Content]] - degree 13, connects to 4 communities