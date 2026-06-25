---
type: community
cohesion: 0.20
members: 18
---

# Learner Dashboard UI

**Cohesion:** 0.20 - loosely connected
**Members:** 18 nodes

## Members
- [[AccountSummary()]] - code - apps/web/components/account/account-summary.tsx
- [[DashboardSidebarBody()]] - code - apps/web/components/layout/dashboard-sidebar.tsx
- [[LearnerDashboardPage()]] - code - apps/web/app/[locale]/(learner)/learner/dashboard/page.tsx
- [[LearnerProgressPage()]] - code - apps/web/app/[locale]/(learner)/learner/progress/page.tsx
- [[LearnerSettingsPage()]] - code - apps/web/app/[locale]/(learner)/learner/settings/page.tsx
- [[StudentWelcomeBanner()]] - code - apps/web/components/learner/student-welcome-banner.tsx
- [[account-summary.tsx]] - code - apps/web/components/account/account-summary.tsx
- [[dismissOnboarding()]] - code - apps/web/lib/onboarding.ts
- [[getOnboardingKey()]] - code - apps/web/lib/onboarding.ts
- [[isOnboardingPending()]] - code - apps/web/lib/onboarding.ts
- [[onboarding.ts]] - code - apps/web/lib/onboarding.ts
- [[page.tsx_16]] - code - apps/web/app/[locale]/(learner)/learner/dashboard/page.tsx
- [[page.tsx_17]] - code - apps/web/app/[locale]/(learner)/learner/progress/page.tsx
- [[page.tsx_18]] - code - apps/web/app/[locale]/(learner)/learner/settings/page.tsx
- [[roleKey]] - code - apps/web/components/account/account-summary.tsx
- [[student-welcome-banner.tsx]] - code - apps/web/components/learner/student-welcome-banner.tsx
- [[useContents()]] - code - apps/web/hooks/useContent.ts
- [[useLearnerSummary()]] - code - apps/web/hooks/useTenant.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Learner_Dashboard_UI
SORT file.name ASC
```

## Connections to other communities
- 7 edges to [[_COMMUNITY_Login Page & Sheet UI]]
- 5 edges to [[_COMMUNITY_Content Status & Processing UI]]
- 4 edges to [[_COMMUNITY_Tenant Students Management UI]]
- 4 edges to [[_COMMUNITY_Shared UI Primitives (@talimui)]]
- 2 edges to [[_COMMUNITY_Admin Generated & Usage UI]]
- 2 edges to [[_COMMUNITY_Learner Assessments UI]]
- 2 edges to [[_COMMUNITY_Auth Guard & App Shell]]
- 2 edges to [[_COMMUNITY_Assign Content UI]]
- 2 edges to [[_COMMUNITY_Profile & Become-Tutor UI]]
- 2 edges to [[_COMMUNITY_Dashboard Search UI]]
- 1 edge to [[_COMMUNITY_Recent Content Grid UI]]
- 1 edge to [[_COMMUNITY_Tenant Dashboard UI]]
- 1 edge to [[_COMMUNITY_Tenant Assessments UI]]
- 1 edge to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]

## Top bridge nodes
- [[page.tsx_16]] - degree 14, connects to 9 communities
- [[useContents()]] - degree 10, connects to 3 communities
- [[student-welcome-banner.tsx]] - degree 8, connects to 3 communities
- [[account-summary.tsx]] - degree 7, connects to 3 communities
- [[page.tsx_17]] - degree 7, connects to 3 communities