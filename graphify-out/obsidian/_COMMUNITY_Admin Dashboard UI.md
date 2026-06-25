---
type: community
cohesion: 0.29
members: 8
---

# Admin Dashboard UI

**Cohesion:** 0.29 - loosely connected
**Members:** 8 nodes

## Members
- [[AdminDashboardPage()]] - code - apps/admin/app/(admin)/dashboard/page.tsx
- [[CardHeader]] - code - packages/ui/components/card.tsx
- [[QuizResult()]] - code - apps/web/components/quiz/QuizResult.tsx
- [[QuizResult.tsx]] - code - apps/web/components/quiz/QuizResult.tsx
- [[QuizResultProps]] - code - apps/web/components/quiz/QuizResult.tsx
- [[StatCard()]] - code - apps/admin/app/(admin)/dashboard/page.tsx
- [[page.tsx_2]] - code - apps/admin/app/(admin)/dashboard/page.tsx
- [[usePlatformStats()]] - code - apps/admin/hooks/useAdmin.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Dashboard_UI
SORT file.name ASC
```

## Connections to other communities
- 6 edges to [[_COMMUNITY_Shared UI Primitives (@talimui)]]
- 4 edges to [[_COMMUNITY_Admin Login & Audit Pages]]
- 2 edges to [[_COMMUNITY_Admin Content & Users UI]]
- 2 edges to [[_COMMUNITY_Quiz Page & Hooks]]
- 1 edge to [[_COMMUNITY_Tenant Detail UI]]
- 1 edge to [[_COMMUNITY_Admin TenantUser Detail UI]]
- 1 edge to [[_COMMUNITY_Profile & Become-Tutor UI]]
- 1 edge to [[_COMMUNITY_Content List Components]]
- 1 edge to [[_COMMUNITY_Admin Generated & Usage UI]]
- 1 edge to [[_COMMUNITY_Login Page & Sheet UI]]
- 1 edge to [[_COMMUNITY_Tenant Students Management UI]]

## Top bridge nodes
- [[CardHeader]] - degree 10, connects to 6 communities
- [[QuizResult.tsx]] - degree 9, connects to 4 communities
- [[page.tsx_2]] - degree 8, connects to 3 communities
- [[QuizResult()]] - degree 3, connects to 2 communities
- [[usePlatformStats()]] - degree 3, connects to 1 community