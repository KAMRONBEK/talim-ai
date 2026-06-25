---
type: community
cohesion: 0.43
members: 7
---

# Admin Tutor-Requests UI

**Cohesion:** 0.43 - moderately connected
**Members:** 7 nodes

## Members
- [[STATUS_FILTERS]] - code - apps/admin/app/(admin)/tutor-requests/page.tsx
- [[TutorRequestsPage()]] - code - apps/admin/app/(admin)/tutor-requests/page.tsx
- [[errorMessage()]] - code - apps/admin/app/(admin)/tutor-requests/page.tsx
- [[page.tsx_7]] - code - apps/admin/app/(admin)/tutor-requests/page.tsx
- [[useAdminTutorRequests()]] - code - apps/admin/hooks/useAdmin.ts
- [[useApproveTutorRequest()]] - code - apps/admin/hooks/useAdmin.ts
- [[useRejectTutorRequest()]] - code - apps/admin/hooks/useAdmin.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Tutor-Requests_UI
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_Admin Content & Users UI]]
- 3 edges to [[_COMMUNITY_Admin Login & Audit Pages]]
- 1 edge to [[_COMMUNITY_Admin Generated & Usage UI]]
- 1 edge to [[_COMMUNITY_Shared UI Primitives (@talimui)]]

## Top bridge nodes
- [[page.tsx_7]] - degree 12, connects to 4 communities
- [[useAdminTutorRequests()]] - degree 3, connects to 1 community
- [[useApproveTutorRequest()]] - degree 3, connects to 1 community
- [[useRejectTutorRequest()]] - degree 3, connects to 1 community