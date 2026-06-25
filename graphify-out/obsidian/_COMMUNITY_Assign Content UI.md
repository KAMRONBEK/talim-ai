---
type: community
cohesion: 0.24
members: 14
---

# Assign Content UI

**Cohesion:** 0.24 - loosely connected
**Members:** 14 nodes

## Members
- [[ActivityHeatmap()]] - code - apps/web/components/tenant/activity-heatmap.tsx
- [[AssignContentPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/materials/[id]/assign/page.tsx
- [[AssignStudentsPanel()]] - code - apps/web/components/tenant/assign-students-panel.tsx
- [[ProgressBar()]] - code - apps/web/components/tenant/activity-heatmap.tsx
- [[TenantStudentDetailPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/[id]/page.tsx
- [[activity-heatmap.tsx]] - code - apps/web/components/tenant/activity-heatmap.tsx
- [[assign-students-panel.tsx]] - code - apps/web/components/tenant/assign-students-panel.tsx
- [[page.tsx_26]] - code - apps/web/app/[locale]/(tenant)/tenant/students/[id]/page.tsx
- [[page.tsx_22]] - code - apps/web/app/[locale]/(tenant)/tenant/materials/[id]/assign/page.tsx
- [[useAssignContent()]] - code - apps/web/hooks/useTenant.ts
- [[useContentAssignments()]] - code - apps/web/hooks/useTenant.ts
- [[useStudentProgress()]] - code - apps/web/hooks/useTenant.ts
- [[useTenantContent()]] - code - apps/web/hooks/useTenantContent.ts
- [[useUnassignContent()]] - code - apps/web/hooks/useTenant.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Assign_Content_UI
SORT file.name ASC
```

## Connections to other communities
- 7 edges to [[_COMMUNITY_Tenant Dashboard UI]]
- 6 edges to [[_COMMUNITY_Tenant Students Management UI]]
- 4 edges to [[_COMMUNITY_Shared UI Primitives (@talimui)]]
- 3 edges to [[_COMMUNITY_Login Page & Sheet UI]]
- 2 edges to [[_COMMUNITY_Learner Dashboard UI]]
- 2 edges to [[_COMMUNITY_Auth Guard & App Shell]]
- 2 edges to [[_COMMUNITY_Admin Generated & Usage UI]]
- 2 edges to [[_COMMUNITY_Content Status & Processing UI]]
- 1 edge to [[_COMMUNITY_Admin Login & Audit Pages]]

## Top bridge nodes
- [[assign-students-panel.tsx]] - degree 12, connects to 6 communities
- [[page.tsx_26]] - degree 12, connects to 5 communities
- [[AssignStudentsPanel()]] - degree 8, connects to 3 communities
- [[page.tsx_22]] - degree 6, connects to 2 communities
- [[TenantStudentDetailPage()]] - degree 5, connects to 2 communities