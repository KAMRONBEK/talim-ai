---
type: community
cohesion: 0.08
members: 43
---

# Tenant Hooks & Messaging

**Cohesion:** 0.08 - loosely connected
**Members:** 43 nodes

## Members
- [[AssessmentCard()]] - code - apps/web/app/[locale]/(learner)/learner/assessments/page.tsx
- [[ClassMastery]] - code - packages/types/index.ts
- [[ContentAssignment]] - code - packages/types/index.ts
- [[CreateLearnerReplyResponse]] - code - packages/types/index.ts
- [[CreateTenantStudentResponse]] - code - packages/types/index.ts
- [[LearnerMessage]] - code - packages/types/index.ts
- [[LearnerMessagesBell()]] - code - apps/web/components/learner/learner-messages-bell.tsx
- [[LearnerSummary]] - code - packages/types/index.ts
- [[LearnerThreadMessage]] - code - packages/types/index.ts
- [[LearnerUnreadCountResponse]] - code - packages/types/index.ts
- [[MarkMessageReadResponse]] - code - packages/types/index.ts
- [[RespondToReplyResponse]] - code - packages/types/index.ts
- [[ResponseBubble()]] - code - apps/web/components/tenant/tenant-messages-bell.tsx
- [[SendTenantMessageInput]] - code - packages/types/index.ts
- [[SendTenantMessageResponse]] - code - packages/types/index.ts
- [[StudentProgressSummary]] - code - packages/types/index.ts
- [[StudentReplyRow()]] - code - apps/web/components/tenant/tenant-messages-bell.tsx
- [[TenantMessageReply]] - code - packages/types/index.ts
- [[TenantMessageThread]] - code - packages/types/index.ts
- [[TenantMessagesBell()]] - code - apps/web/components/tenant/tenant-messages-bell.tsx
- [[TenantProgressPage()]] - code - apps/web/app/[locale]/(tenant)/tenant/progress/page.tsx
- [[TenantProgressSummary]] - code - packages/types/index.ts
- [[TenantSentMessage]] - code - packages/types/index.ts
- [[TenantSentMessagesResponse]] - code - packages/types/index.ts
- [[TenantUnreadReplyCountResponse]] - code - packages/types/index.ts
- [[ThreadBubble()]] - code - apps/web/components/learner/learner-messages-bell.tsx
- [[formatRelativeTime()]] - code - apps/web/lib/format-relative-time.ts
- [[isRecentlyActive()]] - code - apps/web/app/[locale]/(tenant)/tenant/progress/page.tsx
- [[learner-messages-bell.tsx]] - code - apps/web/components/learner/learner-messages-bell.tsx
- [[masteryTone()]] - code - apps/web/app/[locale]/(tenant)/tenant/progress/page.tsx
- [[page.tsx_25]] - code - apps/web/app/[locale]/(tenant)/tenant/progress/page.tsx
- [[tenant-messages-bell.tsx]] - code - apps/web/components/tenant/tenant-messages-bell.tsx
- [[useLearnerMessages()]] - code - apps/web/hooks/useTenant.ts
- [[useLearnerUnreadCount()]] - code - apps/web/hooks/useTenant.ts
- [[useMarkMessageRead()]] - code - apps/web/hooks/useTenant.ts
- [[useMarkTenantMessageRead()]] - code - apps/web/hooks/useTenant.ts
- [[useReplyToLearnerMessage()]] - code - apps/web/hooks/useTenant.ts
- [[useRespondToReply()]] - code - apps/web/hooks/useTenant.ts
- [[useTenant.ts]] - code - apps/web/hooks/useTenant.ts
- [[useTenantMessages()]] - code - apps/web/hooks/useTenant.ts
- [[useTenantProgress()]] - code - apps/web/hooks/useTenant.ts
- [[useTenantProgressTopics()]] - code - apps/web/hooks/useTenant.ts
- [[useTenantUnreadCount()]] - code - apps/web/hooks/useTenant.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant_Hooks__Messaging
SORT file.name ASC
```

## Connections to other communities
- 24 edges to [[_COMMUNITY_Shared Types & Auth Stores]]
- 23 edges to [[_COMMUNITY_Account & Settings UI]]
- 13 edges to [[_COMMUNITY_Content Grid & Learner Dashboard]]
- 9 edges to [[_COMMUNITY_Dialog & Button UI]]
- 6 edges to [[_COMMUNITY_Auth & App Shell UI]]
- 5 edges to [[_COMMUNITY_Assessment Pages & Wizard]]
- 5 edges to [[_COMMUNITY_B2C Dashboard Shell]]
- 4 edges to [[_COMMUNITY_Learner Account & Onboarding]]
- 3 edges to [[_COMMUNITY_Slide Deck UI]]
- 2 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 2 edges to [[_COMMUNITY_Shared UI Primitives]]
- 1 edge to [[_COMMUNITY_Content Workspace & Chat]]

## Top bridge nodes
- [[useTenant.ts]] - degree 62, connects to 7 communities
- [[tenant-messages-bell.tsx]] - degree 22, connects to 7 communities
- [[learner-messages-bell.tsx]] - degree 20, connects to 7 communities
- [[formatRelativeTime()]] - degree 17, connects to 4 communities
- [[page.tsx_25]] - degree 9, connects to 2 communities