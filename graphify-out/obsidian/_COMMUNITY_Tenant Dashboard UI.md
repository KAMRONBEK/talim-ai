---
type: community
cohesion: 0.25
members: 19
---

# Tenant Dashboard UI

**Cohesion:** 0.25 - loosely connected
**Members:** 19 nodes

## Members
- [[OnboardingChecklist()]] - code - apps/web/components/tenant/onboarding-checklist.tsx
- [[RecentContentGrid()]] - code - apps/web/components/dashboard/recent-content-grid.tsx
- [[TenantDashboardPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/dashboard/page.tsx
- [[TenantMaterialsPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/materials/page.tsx
- [[TenantSettingsPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/settings/page.tsx
- [[onboarding-checklist.tsx]] - code - apps/web/components/tenant/onboarding-checklist.tsx
- [[page.tsx_21]] - code - apps/web/app/[locale]/(tenant)/tenant/dashboard/page.tsx
- [[page.tsx_25]] - code - apps/web/app/[locale]/(tenant)/tenant/settings/page.tsx
- [[page.tsx_23]] - code - apps/web/app/[locale]/(tenant)/tenant/materials/page.tsx
- [[useCreateTenantYoutubeContent()]] - code - apps/web/hooks/useTenantContent.ts
- [[useDeleteTenantContent()]] - code - apps/web/hooks/useTenantContent.ts
- [[usePatchTenant()]] - code - apps/web/hooks/useTenant.ts
- [[useRetryTenantContent()]] - code - apps/web/hooks/useTenantContent.ts
- [[useTenantAssessments()]] - code - apps/web/hooks/useAssessments.ts
- [[useTenantContent.ts]] - code - apps/web/hooks/useTenantContent.ts
- [[useTenantContents()]] - code - apps/web/hooks/useTenantContent.ts
- [[useTenantSearch()]] - code - apps/web/contexts/tenant-shell.tsx
- [[useTenantStudents()]] - code - apps/web/hooks/useTenant.ts
- [[useUploadTenantContent()]] - code - apps/web/hooks/useTenantContent.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant_Dashboard_UI
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_Shared UI Primitives (@talimui)]]
- 9 edges to [[_COMMUNITY_Tenant Students Management UI]]
- 7 edges to [[_COMMUNITY_Tenant Assessments UI]]
- 7 edges to [[_COMMUNITY_Assign Content UI]]
- 5 edges to [[_COMMUNITY_Billing & Role-Guard UI]]
- 5 edges to [[_COMMUNITY_Login Page & Sheet UI]]
- 3 edges to [[_COMMUNITY_Admin Generated & Usage UI]]
- 3 edges to [[_COMMUNITY_Recent Content Grid UI]]
- 3 edges to [[_COMMUNITY_Admin Login & Audit Pages]]
- 2 edges to [[_COMMUNITY_Auth Guard & App Shell]]
- 2 edges to [[_COMMUNITY_Profile & Become-Tutor UI]]
- 2 edges to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 2 edges to [[_COMMUNITY_Content List Components]]
- 1 edge to [[_COMMUNITY_Learner Dashboard UI]]
- 1 edge to [[_COMMUNITY_Dashboard Search UI]]

## Top bridge nodes
- [[page.tsx_25]] - degree 19, connects to 7 communities
- [[page.tsx_21]] - degree 16, connects to 7 communities
- [[page.tsx_23]] - degree 18, connects to 5 communities
- [[onboarding-checklist.tsx]] - degree 7, connects to 4 communities
- [[RecentContentGrid()]] - degree 6, connects to 4 communities