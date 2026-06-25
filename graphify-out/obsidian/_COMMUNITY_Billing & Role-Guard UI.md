---
type: community
cohesion: 0.11
members: 36
---

# Billing & Role-Guard UI

**Cohesion:** 0.11 - loosely connected
**Members:** 36 nodes

## Members
- [[BillingMeResponse]] - code - packages/types/index.ts
- [[BillingSummaryCard()]] - code - apps/web/components/account/billing-summary-card.tsx
- [[DashboardHeader()]] - code - apps/web/components/layout/dashboard-header.tsx
- [[DashboardHeaderProps]] - code - apps/web/components/layout/dashboard-header.tsx
- [[LearnerBottomNav()]] - code - apps/web/components/layout/learner-navigation.tsx
- [[LearnerLayout()]] - code - apps/web/app/[locale]/(learner)/layout.tsx
- [[LearnerShell()]] - code - apps/web/contexts/learner-shell.tsx
- [[LearnerSidebar()]] - code - apps/web/components/layout/learner-navigation.tsx
- [[RoleGuard()]] - code - apps/web/components/role-guard.tsx
- [[TenantBillingPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/billing/page.tsx
- [[TenantLayout()]] - code - apps/web/app/[locale]/(tenant)/layout.tsx
- [[TenantSearchContext]] - code - apps/web/contexts/tenant-shell.tsx
- [[TenantShell()]] - code - apps/web/contexts/tenant-shell.tsx
- [[UsageMeter()]] - code - apps/web/components/account/billing-summary-card.tsx
- [[UserSidebarFooter()]] - code - apps/web/components/layout/user-sidebar-footer.tsx
- [[UserSidebarFooterProps]] - code - apps/web/components/layout/user-sidebar-footer.tsx
- [[billing-summary-card.tsx]] - code - apps/web/components/account/billing-summary-card.tsx
- [[dashboard-header.tsx]] - code - apps/web/components/layout/dashboard-header.tsx
- [[getSettingsPathForRole()]] - code - apps/web/lib/auth-routing.ts
- [[getUserDisplayName()]] - code - apps/web/lib/user-display.ts
- [[getUserInitials()]] - code - apps/web/lib/user-display.ts
- [[layout.tsx_2]] - code - apps/web/app/[locale]/(learner)/layout.tsx
- [[layout.tsx_3]] - code - apps/web/app/[locale]/(tenant)/layout.tsx
- [[learner-navigation.tsx]] - code - apps/web/components/layout/learner-navigation.tsx
- [[learner-shell.tsx]] - code - apps/web/contexts/learner-shell.tsx
- [[learnerNavKeys]] - code - apps/web/components/layout/learner-navigation.tsx
- [[page.tsx_20]] - code - apps/web/app/[locale]/(tenant)/tenant/billing/page.tsx
- [[plan.ts]] - code - apps/web/lib/plan.ts
- [[planMessageKey]] - code - apps/web/lib/plan.ts
- [[role-guard.tsx]] - code - apps/web/components/role-guard.tsx
- [[tenant-shell.tsx]] - code - apps/web/contexts/tenant-shell.tsx
- [[useAuthHydrated()_1]] - code - apps/web/components/role-guard.tsx
- [[useBilling()]] - code - apps/web/hooks/useBilling.ts
- [[useBilling.ts]] - code - apps/web/hooks/useBilling.ts
- [[user-display.ts]] - code - apps/web/lib/user-display.ts
- [[user-sidebar-footer.tsx]] - code - apps/web/components/layout/user-sidebar-footer.tsx

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Billing__Role-Guard_UI
SORT file.name ASC
```

## Connections to other communities
- 12 edges to [[_COMMUNITY_Auth Guard & App Shell]]
- 11 edges to [[_COMMUNITY_Login Page & Sheet UI]]
- 9 edges to [[_COMMUNITY_Shared UI Primitives (@talimui)]]
- 8 edges to [[_COMMUNITY_Content Status & Processing UI]]
- 6 edges to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 5 edges to [[_COMMUNITY_Tenant Dashboard UI]]
- 4 edges to [[_COMMUNITY_Dashboard Search UI]]
- 3 edges to [[_COMMUNITY_Tenant Students Management UI]]
- 3 edges to [[_COMMUNITY_Admin Generated & Usage UI]]
- 2 edges to [[_COMMUNITY_Profile & Become-Tutor UI]]
- 1 edge to [[_COMMUNITY_Auth Store (Zustand)]]

## Top bridge nodes
- [[billing-summary-card.tsx]] - degree 13, connects to 6 communities
- [[user-sidebar-footer.tsx]] - degree 20, connects to 5 communities
- [[dashboard-header.tsx]] - degree 16, connects to 4 communities
- [[role-guard.tsx]] - degree 10, connects to 4 communities
- [[tenant-shell.tsx]] - degree 17, connects to 3 communities