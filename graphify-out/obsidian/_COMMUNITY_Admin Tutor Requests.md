---
type: community
cohesion: 0.36
members: 8
---

# Admin Tutor Requests

**Cohesion:** 0.36 - loosely connected
**Members:** 8 nodes

## Members
- [[STATUS_FILTERS]] - code - apps/admin/app/(admin)/tutor-requests/page.tsx
- [[TutorRequestsPage()]] - code - apps/admin/app/(admin)/tutor-requests/page.tsx
- [[errorMessage()_1]] - code - apps/admin/app/(admin)/tutor-requests/page.tsx
- [[page.tsx_7]] - code - apps/admin/app/(admin)/tutor-requests/page.tsx
- [[requestStatusBadge()]] - code - apps/admin/app/(admin)/tutor-requests/page.tsx
- [[useAdminTutorRequests()]] - code - apps/admin/hooks/useAdmin.ts
- [[useApproveTutorRequest()]] - code - apps/admin/hooks/useAdmin.ts
- [[useRejectTutorRequest()]] - code - apps/admin/hooks/useAdmin.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Tutor_Requests
SORT file.name ASC
```

## Connections to other communities
- 5 edges to [[_COMMUNITY_Admin Panel UI]]
- 4 edges to [[_COMMUNITY_Admin Data Hooks]]

## Top bridge nodes
- [[page.tsx_7]] - degree 13, connects to 2 communities
- [[useAdminTutorRequests()]] - degree 3, connects to 1 community
- [[useApproveTutorRequest()]] - degree 3, connects to 1 community
- [[useRejectTutorRequest()]] - degree 3, connects to 1 community