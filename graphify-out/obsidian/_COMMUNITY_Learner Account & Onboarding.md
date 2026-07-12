---
type: community
cohesion: 0.15
members: 20
---

# Learner Account & Onboarding

**Cohesion:** 0.15 - loosely connected
**Members:** 20 nodes

## Members
- [[AccountSummary()]] - code - apps/web/components/account/account-summary.tsx
- [[ActivityHeatmap()]] - code - apps/web/components/tenant/activity-heatmap.tsx
- [[BADGE_LABEL_KEYS]] - code - apps/web/app/[locale]/(learner)/learner/progress/page.tsx
- [[LearnerProgressPage()]] - code - apps/web/app/[locale]/(learner)/learner/progress/page.tsx
- [[LearnerSettingsPage()]] - code - apps/web/app/[locale]/(learner)/learner/settings/page.tsx
- [[ProgressBar()]] - code - apps/web/components/tenant/activity-heatmap.tsx
- [[StatCard()_1]] - code - apps/web/app/[locale]/(learner)/learner/progress/page.tsx
- [[StudentWelcomeBanner()]] - code - apps/web/components/learner/student-welcome-banner.tsx
- [[account-summary.tsx]] - code - apps/web/components/account/account-summary.tsx
- [[activity-heatmap.tsx]] - code - apps/web/components/tenant/activity-heatmap.tsx
- [[dismissOnboarding()]] - code - apps/web/lib/onboarding.ts
- [[getOnboardingKey()]] - code - apps/web/lib/onboarding.ts
- [[isOnboardingPending()]] - code - apps/web/lib/onboarding.ts
- [[onboarding.ts]] - code - apps/web/lib/onboarding.ts
- [[page.tsx_17]] - code - apps/web/app/[locale]/(learner)/learner/progress/page.tsx
- [[page.tsx_18]] - code - apps/web/app/[locale]/(learner)/learner/settings/page.tsx
- [[roleKey]] - code - apps/web/components/account/account-summary.tsx
- [[student-welcome-banner.tsx]] - code - apps/web/components/learner/student-welcome-banner.tsx
- [[useLearnerProgress()]] - code - apps/web/hooks/useTenant.ts
- [[useLearnerSummary()]] - code - apps/web/hooks/useTenant.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Learner_Account__Onboarding
SORT file.name ASC
```

## Connections to other communities
- 6 edges to [[_COMMUNITY_B2C Dashboard Shell]]
- 6 edges to [[_COMMUNITY_Account & Settings UI]]
- 4 edges to [[_COMMUNITY_Content Grid & Learner Dashboard]]
- 4 edges to [[_COMMUNITY_Tenant Hooks & Messaging]]
- 3 edges to [[_COMMUNITY_Shared UI Primitives]]
- 2 edges to [[_COMMUNITY_Auth & App Shell UI]]
- 1 edge to [[_COMMUNITY_Content Assignment & Hooks]]
- 1 edge to [[_COMMUNITY_Shared Types & Auth Stores]]
- 1 edge to [[_COMMUNITY_Slide Deck UI]]

## Top bridge nodes
- [[student-welcome-banner.tsx]] - degree 8, connects to 4 communities
- [[page.tsx_17]] - degree 10, connects to 3 communities
- [[account-summary.tsx]] - degree 7, connects to 3 communities
- [[page.tsx_18]] - degree 9, connects to 2 communities
- [[useLearnerSummary()]] - degree 7, connects to 2 communities