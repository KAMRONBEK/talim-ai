---
type: community
cohesion: 0.15
members: 22
---

# Messaging Hooks

**Cohesion:** 0.15 - loosely connected
**Members:** 22 nodes

## Members
- [[AssessmentCard()]] - code - apps/web/app/[locale]/(learner)/learner/assessments/page.tsx
- [[LOCALE_MAP]] - code - apps/web/lib/format-relative-time.ts
- [[LearnerMessagesBell()]] - code - apps/web/components/learner/learner-messages-bell.tsx
- [[ResponseBubble()]] - code - apps/web/components/tenant/tenant-messages-bell.tsx
- [[StudentReplyRow()]] - code - apps/web/components/tenant/tenant-messages-bell.tsx
- [[TenantMessagesBell()]] - code - apps/web/components/tenant/tenant-messages-bell.tsx
- [[ThreadBubble()]] - code - apps/web/components/learner/learner-messages-bell.tsx
- [[UNITS]] - code - apps/web/lib/format-relative-time.ts
- [[UZ_UNIT_LABELS]] - code - apps/web/lib/format-relative-time.ts
- [[format-relative-time.ts]] - code - apps/web/lib/format-relative-time.ts
- [[formatRelativeTime()]] - code - apps/web/lib/format-relative-time.ts
- [[formatUzbek()]] - code - apps/web/lib/format-relative-time.ts
- [[learner-messages-bell.tsx]] - code - apps/web/components/learner/learner-messages-bell.tsx
- [[tenant-messages-bell.tsx]] - code - apps/web/components/tenant/tenant-messages-bell.tsx
- [[useLearnerMessages()]] - code - apps/web/hooks/useTenant.ts
- [[useLearnerUnreadCount()]] - code - apps/web/hooks/useTenant.ts
- [[useMarkMessageRead()]] - code - apps/web/hooks/useTenant.ts
- [[useMarkTenantMessageRead()]] - code - apps/web/hooks/useTenant.ts
- [[useReplyToLearnerMessage()]] - code - apps/web/hooks/useTenant.ts
- [[useRespondToReply()]] - code - apps/web/hooks/useTenant.ts
- [[useTenantMessages()]] - code - apps/web/hooks/useTenant.ts
- [[useTenantUnreadCount()]] - code - apps/web/hooks/useTenant.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Messaging_Hooks
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_Auth & Assignment UI]]
- 10 edges to [[_COMMUNITY_Tenant Dashboard & Hooks]]
- 8 edges to [[_COMMUNITY_Dialog Components]]
- 6 edges to [[_COMMUNITY_Tenant Assessment Builder UI]]
- 6 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 4 edges to [[_COMMUNITY_Billing & Access Guards]]
- 4 edges to [[_COMMUNITY_Shared UI Primitives]]
- 3 edges to [[_COMMUNITY_Learner Dashboard]]
- 3 edges to [[_COMMUNITY_Flashcards UI]]
- 2 edges to [[_COMMUNITY_Dashboard Search]]
- 2 edges to [[_COMMUNITY_Sheet & Layout Components]]

## Top bridge nodes
- [[tenant-messages-bell.tsx]] - degree 22, connects to 7 communities
- [[learner-messages-bell.tsx]] - degree 20, connects to 7 communities
- [[format-relative-time.ts]] - degree 15, connects to 7 communities
- [[formatRelativeTime()]] - degree 17, connects to 5 communities
- [[LearnerMessagesBell()]] - degree 7, connects to 2 communities