---
type: community
cohesion: 0.29
members: 13
---

# Admin Login & Audit Pages

**Cohesion:** 0.29 - loosely connected
**Members:** 13 nodes

## Members
- [[AuditLogPage()]] - code - apps/admin/app/(admin)/audit/page.tsx
- [[AuthResponse]] - code - packages/types/index.ts
- [[AuthShell()]] - code - apps/web/components/auth/auth-shell.tsx
- [[Card]] - code - packages/ui/components/card.tsx
- [[CardContent]] - code - packages/ui/components/card.tsx
- [[Input]] - code - packages/ui/components/input.tsx
- [[Label()]] - code - packages/ui/components/label.tsx
- [[LoginPage()]] - code - apps/admin/app/login/page.tsx
- [[page.tsx_11]] - code - apps/admin/app/login/page.tsx
- [[page.tsx_13]] - code - apps/web/app/[locale]/(auth)/login/page.tsx
- [[page.tsx]] - code - apps/admin/app/(admin)/audit/page.tsx
- [[page.tsx_14]] - code - apps/web/app/[locale]/(auth)/register/page.tsx
- [[useAdminAuditLogs()]] - code - apps/admin/hooks/useAdmin.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Login__Audit_Pages
SORT file.name ASC
```

## Connections to other communities
- 16 edges to [[_COMMUNITY_Shared UI Primitives (@talimui)]]
- 6 edges to [[_COMMUNITY_Auth Guard & App Shell]]
- 6 edges to [[_COMMUNITY_Profile & Become-Tutor UI]]
- 5 edges to [[_COMMUNITY_Admin TenantUser Detail UI]]
- 4 edges to [[_COMMUNITY_Admin Generated & Usage UI]]
- 4 edges to [[_COMMUNITY_Admin Content & Users UI]]
- 4 edges to [[_COMMUNITY_Admin Dashboard UI]]
- 4 edges to [[_COMMUNITY_Tenant Detail UI]]
- 4 edges to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 4 edges to [[_COMMUNITY_Content Status & Processing UI]]
- 4 edges to [[_COMMUNITY_Tenant Students Management UI]]
- 3 edges to [[_COMMUNITY_Admin Tutor-Requests UI]]
- 3 edges to [[_COMMUNITY_Tenant Dashboard UI]]
- 3 edges to [[_COMMUNITY_Rich Text & Quiz Card UI]]
- 2 edges to [[_COMMUNITY_Login Page & Sheet UI]]
- 2 edges to [[_COMMUNITY_Learner Assessments UI]]
- 2 edges to [[_COMMUNITY_Tenant Assessments UI]]
- 2 edges to [[_COMMUNITY_Content List Components]]
- 1 edge to [[_COMMUNITY_Admin Subscriptions UI]]
- 1 edge to [[_COMMUNITY_Dashboard Search UI]]
- 1 edge to [[_COMMUNITY_Assign Content UI]]

## Top bridge nodes
- [[Input]] - degree 25, connects to 15 communities
- [[Card]] - degree 16, connects to 9 communities
- [[CardContent]] - degree 16, connects to 9 communities
- [[Label()]] - degree 13, connects to 7 communities
- [[page.tsx_13]] - degree 14, connects to 6 communities