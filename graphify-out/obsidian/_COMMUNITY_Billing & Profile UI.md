---
type: community
cohesion: 0.06
members: 65
---

# Billing & Profile UI

**Cohesion:** 0.06 - loosely connected
**Members:** 65 nodes

## Members
- [[ActivityHeatmap()]] - code - apps/web/components/tenant/activity-heatmap.tsx
- [[AssignStudentsPanel()]] - code - apps/web/components/tenant/assign-students-panel.tsx
- [[BillingSummaryCard()]] - code - apps/web/components/account/billing-summary-card.tsx
- [[Button]] - code - packages/ui/components/button.tsx
- [[DashboardSettingsPage()]] - code - apps/web/app/[locale]/dashboard/settings/page.tsx
- [[FILTER_CHIPS]] - code - apps/web/app/[locale]/(tenant)/tenant/materials/page.tsx
- [[JoinCodeCard()]] - code - apps/web/components/tenant/join-code-card.tsx
- [[MaterialFilter]] - code - apps/web/app/[locale]/(tenant)/tenant/materials/page.tsx
- [[OnboardingChecklist()]] - code - apps/web/components/tenant/onboarding-checklist.tsx
- [[ProfileCard()]] - code - apps/web/components/account/profile-card.tsx
- [[ProgressBar()]] - code - apps/web/components/tenant/activity-heatmap.tsx
- [[StatCard()_2]] - code - apps/web/app/[locale]/(tenant)/tenant/dashboard/page.tsx
- [[StudentImportResponse]] - code - packages/types/index.ts
- [[TenantDashboardPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/dashboard/page.tsx
- [[TenantMaterialsPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/materials/page.tsx
- [[TenantSettingsPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/settings/page.tsx
- [[TenantStudent]] - code - packages/types/index.ts
- [[TenantStudentDetailPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/[id]/page.tsx
- [[TenantStudentsPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/page.tsx
- [[ThemeToggle()]] - code - apps/admin/components/theme-toggle.tsx
- [[ThemeToggle()_1]] - code - apps/web/components/theme-toggle.tsx
- [[ThemeValue]] - code - apps/admin/components/theme-toggle.tsx
- [[ThemeValue_1]] - code - apps/web/components/theme-toggle.tsx
- [[UsageMeter()]] - code - apps/web/components/account/billing-summary-card.tsx
- [[activity-heatmap.tsx]] - code - apps/web/components/tenant/activity-heatmap.tsx
- [[apiError()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/page.tsx
- [[assign-students-panel.tsx]] - code - apps/web/components/tenant/assign-students-panel.tsx
- [[billing-summary-card.tsx]] - code - apps/web/components/account/billing-summary-card.tsx
- [[join-code-card.tsx]] - code - apps/web/components/tenant/join-code-card.tsx
- [[onboarding-checklist.tsx]] - code - apps/web/components/tenant/onboarding-checklist.tsx
- [[page.tsx_36]] - code - apps/web/app/[locale]/dashboard/settings/page.tsx
- [[page.tsx_21]] - code - apps/web/app/[locale]/(tenant)/tenant/dashboard/page.tsx
- [[page.tsx_26]] - code - apps/web/app/[locale]/(tenant)/tenant/settings/page.tsx
- [[page.tsx_27]] - code - apps/web/app/[locale]/(tenant)/tenant/students/[id]/page.tsx
- [[page.tsx_24]] - code - apps/web/app/[locale]/(tenant)/tenant/materials/page.tsx
- [[page.tsx_28]] - code - apps/web/app/[locale]/(tenant)/tenant/students/page.tsx
- [[profile-card.tsx]] - code - apps/web/components/account/profile-card.tsx
- [[profileInitials()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/[id]/page.tsx
- [[studentInitials()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/page.tsx
- [[theme-toggle.tsx]] - code - apps/admin/components/theme-toggle.tsx
- [[theme-toggle.tsx_1]] - code - apps/web/components/theme-toggle.tsx
- [[themeIcons]] - code - apps/web/components/theme-toggle.tsx
- [[themeMeta]] - code - apps/admin/components/theme-toggle.tsx
- [[themeValues]] - code - apps/admin/components/theme-toggle.tsx
- [[themeValues_1]] - code - apps/web/components/theme-toggle.tsx
- [[useAccount.ts]] - code - apps/web/hooks/useAccount.ts
- [[useAssignContent()]] - code - apps/web/hooks/useTenant.ts
- [[useChangePassword()]] - code - apps/web/hooks/useAccount.ts
- [[useContentAssignments()]] - code - apps/web/hooks/useTenant.ts
- [[useCreateTenantStudent()]] - code - apps/web/hooks/useTenant.ts
- [[useCreateTenantYoutubeContent()]] - code - apps/web/hooks/useTenantContent.ts
- [[useImportStudents()]] - code - apps/web/hooks/useTenant.ts
- [[usePatchTenant()]] - code - apps/web/hooks/useTenant.ts
- [[usePatchTenantStudent()]] - code - apps/web/hooks/useTenant.ts
- [[useRegenerateJoinCode()]] - code - apps/web/hooks/useTenant.ts
- [[useResetTenantStudentPassword()]] - code - apps/web/hooks/useTenant.ts
- [[useSendTenantMessage()]] - code - apps/web/hooks/useTenant.ts
- [[useStudentProgress()]] - code - apps/web/hooks/useTenant.ts
- [[useTenant()]] - code - apps/web/hooks/useTenant.ts
- [[useTenantContents()]] - code - apps/web/hooks/useTenantContent.ts
- [[useTenantSearch()]] - code - apps/web/contexts/tenant-shell.tsx
- [[useTenantStudents()]] - code - apps/web/hooks/useTenant.ts
- [[useUnassignContent()]] - code - apps/web/hooks/useTenant.ts
- [[useUpdateProfile()]] - code - apps/web/hooks/useAccount.ts
- [[useUploadTenantContent()]] - code - apps/web/hooks/useTenantContent.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Billing__Profile_UI
SORT file.name ASC
```

## Connections to other communities
- 40 edges to [[_COMMUNITY_Login & Assign Content]]
- 23 edges to [[_COMMUNITY_Tenant Messages & Progress]]
- 22 edges to [[_COMMUNITY_Become Tutor & Auth Shell]]
- 18 edges to [[_COMMUNITY_Tenant Billing Page]]
- 17 edges to [[_COMMUNITY_Learner Dashboard]]
- 15 edges to [[_COMMUNITY_Content Status UI]]
- 9 edges to [[_COMMUNITY_Tenant Assessments Page]]
- 7 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 5 edges to [[_COMMUNITY_Flashcards Page]]
- 4 edges to [[_COMMUNITY_API Endpoints & Chat UI]]
- 3 edges to [[_COMMUNITY_Global Providers & Upgrade Modal]]
- 2 edges to [[_COMMUNITY_Subscription Edit Drawer]]
- 2 edges to [[_COMMUNITY_Admin Tenant Hooks]]
- 2 edges to [[_COMMUNITY_Game Quiz Player]]
- 2 edges to [[_COMMUNITY_Assessment Leaderboard]]
- 2 edges to [[_COMMUNITY_Quiz Page & Hooks]]
- 1 edge to [[_COMMUNITY_Admin Generated Media Review]]
- 1 edge to [[_COMMUNITY_Admin Tutor Requests]]
- 1 edge to [[_COMMUNITY_Admin Content Page]]
- 1 edge to [[_COMMUNITY_Admin User Management]]
- 1 edge to [[_COMMUNITY_API Client & Locale Routing]]
- 1 edge to [[_COMMUNITY_Upgrade Dialog & Pricing]]
- 1 edge to [[_COMMUNITY_Transcript Panel & Video Viewer]]
- 1 edge to [[_COMMUNITY_Quiz Answer Input Components]]
- 1 edge to [[_COMMUNITY_Question Editor Component]]
- 1 edge to [[_COMMUNITY_Auth Store & Admin Users]]

## Top bridge nodes
- [[Button]] - degree 56, connects to 21 communities
- [[page.tsx_21]] - degree 17, connects to 7 communities
- [[page.tsx_28]] - degree 30, connects to 6 communities
- [[page.tsx_26]] - degree 21, connects to 6 communities
- [[billing-summary-card.tsx]] - degree 14, connects to 5 communities