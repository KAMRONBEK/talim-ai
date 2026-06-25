---
type: community
cohesion: 0.33
members: 11
---

# Dashboard Search UI

**Cohesion:** 0.33 - loosely connected
**Members:** 11 nodes

## Members
- [[DashboardLayout()]] - code - apps/web/app/[locale]/dashboard/layout.tsx
- [[DashboardPage()]] - code - apps/web/app/[locale]/dashboard/page.tsx
- [[DashboardSearchBar()]] - code - apps/web/components/dashboard/dashboard-search-bar.tsx
- [[DashboardSearchContext]] - code - apps/web/contexts/dashboard-search.tsx
- [[DashboardShell()]] - code - apps/web/contexts/dashboard-search.tsx
- [[dashboard-search-bar.tsx]] - code - apps/web/components/dashboard/dashboard-search-bar.tsx
- [[dashboard-search.tsx]] - code - apps/web/contexts/dashboard-search.tsx
- [[getFirstName()]] - code - apps/web/app/[locale]/dashboard/page.tsx
- [[layout.tsx_5]] - code - apps/web/app/[locale]/dashboard/layout.tsx
- [[page.tsx_32]] - code - apps/web/app/[locale]/dashboard/page.tsx
- [[useDashboardSearch()]] - code - apps/web/contexts/dashboard-search.tsx

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Dashboard_Search_UI
SORT file.name ASC
```

## Connections to other communities
- 5 edges to [[_COMMUNITY_Login Page & Sheet UI]]
- 4 edges to [[_COMMUNITY_Content Status & Processing UI]]
- 4 edges to [[_COMMUNITY_Billing & Role-Guard UI]]
- 3 edges to [[_COMMUNITY_Shared UI Primitives (@talimui)]]
- 2 edges to [[_COMMUNITY_Learner Dashboard UI]]
- 1 edge to [[_COMMUNITY_Recent Content Grid UI]]
- 1 edge to [[_COMMUNITY_Tenant Dashboard UI]]
- 1 edge to [[_COMMUNITY_Admin Generated & Usage UI]]
- 1 edge to [[_COMMUNITY_Admin Login & Audit Pages]]

## Top bridge nodes
- [[page.tsx_32]] - degree 12, connects to 5 communities
- [[dashboard-search.tsx]] - degree 15, connects to 3 communities
- [[dashboard-search-bar.tsx]] - degree 7, connects to 3 communities
- [[DashboardPage()]] - degree 5, connects to 2 communities
- [[DashboardSearchBar()]] - degree 4, connects to 1 community