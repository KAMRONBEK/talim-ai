---
type: community
cohesion: 0.07
members: 60
---

# Tenant Dashboard & Hooks

**Cohesion:** 0.07 - loosely connected
**Members:** 60 nodes

## Members
- [[ActivityHeatmap()]] - code - apps/web/components/tenant/activity-heatmap.tsx
- [[AssignStudentsPanel()]] - code - apps/web/components/tenant/assign-students-panel.tsx
- [[ClassMastery]] - code - packages/types/index.ts
- [[ContentAssignment]] - code - packages/types/index.ts
- [[CreateLearnerReplyResponse]] - code - packages/types/index.ts
- [[CreateTenantStudentResponse]] - code - packages/types/index.ts
- [[JoinCodeCard()]] - code - apps/web/components/tenant/join-code-card.tsx
- [[LearnerMessage]] - code - packages/types/index.ts
- [[LearnerSummary]] - code - packages/types/index.ts
- [[LearnerUnreadCountResponse]] - code - packages/types/index.ts
- [[MarkMessageReadResponse]] - code - packages/types/index.ts
- [[OnboardingChecklist()]] - code - apps/web/components/tenant/onboarding-checklist.tsx
- [[ProgressBar()]] - code - apps/web/components/tenant/activity-heatmap.tsx
- [[RespondToReplyResponse]] - code - packages/types/index.ts
- [[SendTenantMessageInput]] - code - packages/types/index.ts
- [[SendTenantMessageResponse]] - code - packages/types/index.ts
- [[StatCard()_2]] - code - apps/web/app/[locale]/(tenant)/tenant/dashboard/page.tsx
- [[StudentImportResponse]] - code - packages/types/index.ts
- [[StudentProgressSummary]] - code - packages/types/index.ts
- [[TenantDashboardPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/dashboard/page.tsx
- [[TenantProgressPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/progress/page.tsx
- [[TenantProgressSummary]] - code - packages/types/index.ts
- [[TenantSentMessagesResponse]] - code - packages/types/index.ts
- [[TenantSettingsPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/settings/page.tsx
- [[TenantSidebarBody()]] - code - apps/web/components/layout/tenant-sidebar.tsx
- [[TenantStudent]] - code - packages/types/index.ts
- [[TenantStudentDetailPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/[id]/page.tsx
- [[TenantStudentsPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/page.tsx
- [[TenantUnreadReplyCountResponse]] - code - packages/types/index.ts
- [[activity-heatmap.tsx]] - code - apps/web/components/tenant/activity-heatmap.tsx
- [[apiError()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/page.tsx
- [[assign-students-panel.tsx]] - code - apps/web/components/tenant/assign-students-panel.tsx
- [[isRecentlyActive()]] - code - apps/web/app/[locale]/(tenant)/tenant/progress/page.tsx
- [[masteryTone()]] - code - apps/web/app/[locale]/(tenant)/tenant/progress/page.tsx
- [[onboarding-checklist.tsx]] - code - apps/web/components/tenant/onboarding-checklist.tsx
- [[page.tsx_21]] - code - apps/web/app/[locale]/(tenant)/tenant/dashboard/page.tsx
- [[page.tsx_25]] - code - apps/web/app/[locale]/(tenant)/tenant/progress/page.tsx
- [[page.tsx_26]] - code - apps/web/app/[locale]/(tenant)/tenant/settings/page.tsx
- [[page.tsx_27]] - code - apps/web/app/[locale]/(tenant)/tenant/students/[id]/page.tsx
- [[page.tsx_28]] - code - apps/web/app/[locale]/(tenant)/tenant/students/page.tsx
- [[profileInitials()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/[id]/page.tsx
- [[studentInitials()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/page.tsx
- [[useAssignContent()]] - code - apps/web/hooks/useTenant.ts
- [[useContentAssignments()]] - code - apps/web/hooks/useTenant.ts
- [[useCreateTenantStudent()]] - code - apps/web/hooks/useTenant.ts
- [[useImportStudents()]] - code - apps/web/hooks/useTenant.ts
- [[usePatchTenant()]] - code - apps/web/hooks/useTenant.ts
- [[usePatchTenantStudent()]] - code - apps/web/hooks/useTenant.ts
- [[useRegenerateJoinCode()]] - code - apps/web/hooks/useTenant.ts
- [[useResetTenantStudentPassword()]] - code - apps/web/hooks/useTenant.ts
- [[useSendTenantMessage()]] - code - apps/web/hooks/useTenant.ts
- [[useStudentProgress()]] - code - apps/web/hooks/useTenant.ts
- [[useTenant()]] - code - apps/web/hooks/useTenant.ts
- [[useTenant.ts]] - code - apps/web/hooks/useTenant.ts
- [[useTenantAssessments()]] - code - apps/web/hooks/useAssessments.ts
- [[useTenantContents()]] - code - apps/web/hooks/useTenantContent.ts
- [[useTenantProgress()]] - code - apps/web/hooks/useTenant.ts
- [[useTenantProgressTopics()]] - code - apps/web/hooks/useTenant.ts
- [[useTenantStudents()]] - code - apps/web/hooks/useTenant.ts
- [[useUnassignContent()]] - code - apps/web/hooks/useTenant.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant_Dashboard__Hooks
SORT file.name ASC
```

## Connections to other communities
- 23 edges to [[_COMMUNITY_Shared UI Primitives]]
- 23 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 16 edges to [[_COMMUNITY_Auth & Assignment UI]]
- 10 edges to [[_COMMUNITY_Tenant Assessment Builder UI]]
- 10 edges to [[_COMMUNITY_Messaging Hooks]]
- 9 edges to [[_COMMUNITY_Learner Dashboard]]
- 9 edges to [[_COMMUNITY_Marketing Landing Components]]
- 8 edges to [[_COMMUNITY_Dialog Components]]
- 6 edges to [[_COMMUNITY_Billing & Access Guards]]
- 6 edges to [[_COMMUNITY_Content Query Hooks]]
- 2 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 2 edges to [[_COMMUNITY_Dashboard Search]]
- 2 edges to [[_COMMUNITY_Content Detail Page]]
- 1 edge to [[_COMMUNITY_Web Providers & Job-Event Stream]]

## Top bridge nodes
- [[useTenant.ts]] - degree 62, connects to 7 communities
- [[page.tsx_28]] - degree 30, connects to 7 communities
- [[page.tsx_21]] - degree 17, connects to 7 communities
- [[page.tsx_26]] - degree 21, connects to 4 communities
- [[useTenantContents()]] - degree 14, connects to 4 communities