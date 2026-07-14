---
type: community
cohesion: 0.06
members: 62
---

# Tenant Students & Messaging UI

**Cohesion:** 0.06 - loosely connected
**Members:** 62 nodes

## Members
- [[ActivityHeatmap()]] - code - apps/web/components/tenant/activity-heatmap.tsx
- [[AssignStudentsPanel()]] - code - apps/web/components/tenant/assign-students-panel.tsx
- [[BADGE_LABEL_KEYS]] - code - apps/web/app/[locale]/(learner)/learner/progress/page.tsx
- [[ClassMastery]] - code - packages/types/index.ts
- [[ContentAssignment]] - code - packages/types/index.ts
- [[CreateLearnerReplyResponse]] - code - packages/types/index.ts
- [[CreateTenantStudentResponse]] - code - packages/types/index.ts
- [[JoinCodeCard()]] - code - apps/web/components/tenant/join-code-card.tsx
- [[LearnerMessage]] - code - packages/types/index.ts
- [[LearnerMessagesBell()]] - code - apps/web/components/learner/learner-messages-bell.tsx
- [[LearnerProgressPage()]] - code - apps/web/app/[locale]/(learner)/learner/progress/page.tsx
- [[LearnerSummary]] - code - packages/types/index.ts
- [[LearnerThreadMessage]] - code - packages/types/index.ts
- [[LearnerUnreadCountResponse]] - code - packages/types/index.ts
- [[MarkMessageReadResponse]] - code - packages/types/index.ts
- [[ProgressBar()]] - code - apps/web/components/tenant/activity-heatmap.tsx
- [[RespondToReplyResponse]] - code - packages/types/index.ts
- [[SendTenantMessageInput]] - code - packages/types/index.ts
- [[SendTenantMessageResponse]] - code - packages/types/index.ts
- [[StatCard()_1]] - code - apps/web/app/[locale]/(learner)/learner/progress/page.tsx
- [[StudentImportResponse]] - code - packages/types/index.ts
- [[StudentProgressSummary]] - code - packages/types/index.ts
- [[TenantProgressPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/progress/page.tsx
- [[TenantProgressSummary]] - code - packages/types/index.ts
- [[TenantSentMessagesResponse]] - code - packages/types/index.ts
- [[TenantSidebarBody()]] - code - apps/web/components/layout/tenant-sidebar.tsx
- [[TenantStudentDetailPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/[id]/page.tsx
- [[TenantStudentsPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/page.tsx
- [[TenantUnreadReplyCountResponse]] - code - packages/types/index.ts
- [[activity-heatmap.tsx]] - code - apps/web/components/tenant/activity-heatmap.tsx
- [[apiError()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/page.tsx
- [[assign-students-panel.tsx]] - code - apps/web/components/tenant/assign-students-panel.tsx
- [[isRecentlyActive()]] - code - apps/web/app/[locale]/(tenant)/tenant/progress/page.tsx
- [[join-code-card.tsx]] - code - apps/web/components/tenant/join-code-card.tsx
- [[learner-messages-bell.tsx]] - code - apps/web/components/learner/learner-messages-bell.tsx
- [[masteryTone()]] - code - apps/web/app/[locale]/(tenant)/tenant/progress/page.tsx
- [[page.tsx_17]] - code - apps/web/app/[locale]/(learner)/learner/progress/page.tsx
- [[page.tsx_25]] - code - apps/web/app/[locale]/(tenant)/tenant/progress/page.tsx
- [[page.tsx_27]] - code - apps/web/app/[locale]/(tenant)/tenant/students/[id]/page.tsx
- [[page.tsx_28]] - code - apps/web/app/[locale]/(tenant)/tenant/students/page.tsx
- [[profileInitials()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/[id]/page.tsx
- [[studentInitials()]] - code - apps/web/app/[locale]/(tenant)/tenant/students/page.tsx
- [[useAssignContent()]] - code - apps/web/hooks/useTenant.ts
- [[useContentAssignments()]] - code - apps/web/hooks/useTenant.ts
- [[useCreateTenantStudent()]] - code - apps/web/hooks/useTenant.ts
- [[useImportStudents()]] - code - apps/web/hooks/useTenant.ts
- [[useLearnerMessages()]] - code - apps/web/hooks/useTenant.ts
- [[useLearnerProgress()]] - code - apps/web/hooks/useTenant.ts
- [[useLearnerUnreadCount()]] - code - apps/web/hooks/useTenant.ts
- [[useMarkMessageRead()]] - code - apps/web/hooks/useTenant.ts
- [[usePatchTenantStudent()]] - code - apps/web/hooks/useTenant.ts
- [[useRegenerateJoinCode()]] - code - apps/web/hooks/useTenant.ts
- [[useReplyToLearnerMessage()]] - code - apps/web/hooks/useTenant.ts
- [[useResetTenantStudentPassword()]] - code - apps/web/hooks/useTenant.ts
- [[useSendTenantMessage()]] - code - apps/web/hooks/useTenant.ts
- [[useStudentProgress()]] - code - apps/web/hooks/useTenant.ts
- [[useTenant()]] - code - apps/web/hooks/useTenant.ts
- [[useTenant.ts]] - code - apps/web/hooks/useTenant.ts
- [[useTenantProgress()]] - code - apps/web/hooks/useTenant.ts
- [[useTenantProgressTopics()]] - code - apps/web/hooks/useTenant.ts
- [[useTenantStudents()]] - code - apps/web/hooks/useTenant.ts
- [[useUnassignContent()]] - code - apps/web/hooks/useTenant.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant_Students__Messaging_UI
SORT file.name ASC
```

## Connections to other communities
- 22 edges to [[_COMMUNITY_Shared Types & Locale]]
- 16 edges to [[_COMMUNITY_Tenant Pages & Billing UI]]
- 16 edges to [[_COMMUNITY_Admin Panel UI]]
- 12 edges to [[_COMMUNITY_App Shells & Navigation]]
- 10 edges to [[_COMMUNITY_Practice & Content Dialogs]]
- 9 edges to [[_COMMUNITY_Message Bells & Threads]]
- 8 edges to [[_COMMUNITY_Marketing Landing Page]]
- 7 edges to [[_COMMUNITY_Learner Dashboard]]
- 7 edges to [[_COMMUNITY_Content Hooks & Status]]
- 6 edges to [[_COMMUNITY_Shared UI Primitives]]
- 3 edges to [[_COMMUNITY_Assessments & Game Quiz UI]]
- 2 edges to [[_COMMUNITY_Tenant Progress & Mastery]]
- 1 edge to [[_COMMUNITY_Content Stage & Limits]]

## Top bridge nodes
- [[useTenant.ts]] - degree 62, connects to 7 communities
- [[page.tsx_28]] - degree 30, connects to 7 communities
- [[learner-messages-bell.tsx]] - degree 20, connects to 7 communities
- [[page.tsx_27]] - degree 13, connects to 4 communities
- [[TenantStudentsPage()]] - degree 12, connects to 4 communities