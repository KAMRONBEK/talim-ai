---
type: community
cohesion: 0.15
members: 22
---

# Tenant Students Management UI

**Cohesion:** 0.15 - loosely connected
**Members:** 22 nodes

## Members
- [[ContentAssignment]] - code - packages/types/index.ts
- [[CreateTenantStudentResponse]] - code - packages/types/index.ts
- [[JoinCodeCard()]] - code - apps/web/components/tenant/join-code-card.tsx
- [[LearnerSummary]] - code - packages/types/index.ts
- [[StudentProgressSummary]] - code - packages/types/index.ts
- [[TenantProgressPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/progress/page.tsx
- [[TenantProgressSummary]] - code - packages/types/index.ts
- [[TenantSidebarBody()]] - code - apps/web/components/layout/tenant-sidebar.tsx
- [[TenantStudent]] - code - packages/types/index.ts
- [[TenantStudentsPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/page.tsx
- [[apiError()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/page.tsx
- [[isRecentlyActive()]] - code - apps/web/app/[locale]/(tenant)/tenant/progress/page.tsx
- [[join-code-card.tsx]] - code - apps/web/components/tenant/join-code-card.tsx
- [[page.tsx_24]] - code - apps/web/app/[locale]/(tenant)/tenant/progress/page.tsx
- [[page.tsx_27]] - code - apps/web/app/[locale]/(tenant)/tenant/students/page.tsx
- [[useCreateTenantStudent()]] - code - apps/web/hooks/useTenant.ts
- [[usePatchTenantStudent()]] - code - apps/web/hooks/useTenant.ts
- [[useRegenerateJoinCode()]] - code - apps/web/hooks/useTenant.ts
- [[useResetTenantStudentPassword()]] - code - apps/web/hooks/useTenant.ts
- [[useTenant()]] - code - apps/web/hooks/useTenant.ts
- [[useTenant.ts]] - code - apps/web/hooks/useTenant.ts
- [[useTenantProgress()]] - code - apps/web/hooks/useTenant.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant_Students_Management_UI
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_Tenant Dashboard UI]]
- 8 edges to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 7 edges to [[_COMMUNITY_Login Page & Sheet UI]]
- 7 edges to [[_COMMUNITY_Shared UI Primitives (@talimui)]]
- 6 edges to [[_COMMUNITY_Assign Content UI]]
- 4 edges to [[_COMMUNITY_Learner Dashboard UI]]
- 4 edges to [[_COMMUNITY_Admin Login & Audit Pages]]
- 3 edges to [[_COMMUNITY_Billing & Role-Guard UI]]
- 2 edges to [[_COMMUNITY_Auth Guard & App Shell]]
- 2 edges to [[_COMMUNITY_Admin Generated & Usage UI]]
- 1 edge to [[_COMMUNITY_Tenant Assessments UI]]
- 1 edge to [[_COMMUNITY_Admin Dashboard UI]]

## Top bridge nodes
- [[useTenant.ts]] - degree 33, connects to 6 communities
- [[page.tsx_27]] - degree 21, connects to 6 communities
- [[join-code-card.tsx]] - degree 10, connects to 4 communities
- [[TenantStudentsPage()]] - degree 7, connects to 3 communities
- [[useTenant()]] - degree 7, connects to 2 communities