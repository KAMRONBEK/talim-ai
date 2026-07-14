---
type: community
cohesion: 0.15
members: 19
---

# Message Bells & Threads

**Cohesion:** 0.15 - loosely connected
**Members:** 19 nodes

## Members
- [[AssessmentCard()]] - code - apps/web/app/[locale]/(learner)/learner/assessments/page.tsx
- [[LOCALE_MAP]] - code - apps/web/lib/format-relative-time.ts
- [[ResponseBubble()]] - code - apps/web/components/tenant/tenant-messages-bell.tsx
- [[StudentReplyRow()]] - code - apps/web/components/tenant/tenant-messages-bell.tsx
- [[TenantMessageReply]] - code - packages/types/index.ts
- [[TenantMessageThread]] - code - packages/types/index.ts
- [[TenantMessagesBell()]] - code - apps/web/components/tenant/tenant-messages-bell.tsx
- [[TenantSentMessage]] - code - packages/types/index.ts
- [[ThreadBubble()]] - code - apps/web/components/learner/learner-messages-bell.tsx
- [[UNITS]] - code - apps/web/lib/format-relative-time.ts
- [[UZ_UNIT_LABELS]] - code - apps/web/lib/format-relative-time.ts
- [[format-relative-time.ts]] - code - apps/web/lib/format-relative-time.ts
- [[formatRelativeTime()]] - code - apps/web/lib/format-relative-time.ts
- [[formatUzbek()]] - code - apps/web/lib/format-relative-time.ts
- [[tenant-messages-bell.tsx]] - code - apps/web/components/tenant/tenant-messages-bell.tsx
- [[useMarkTenantMessageRead()]] - code - apps/web/hooks/useTenant.ts
- [[useRespondToReply()]] - code - apps/web/hooks/useTenant.ts
- [[useTenantMessages()]] - code - apps/web/hooks/useTenant.ts
- [[useTenantUnreadCount()]] - code - apps/web/hooks/useTenant.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Message_Bells__Threads
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_Tenant Students & Messaging UI]]
- 6 edges to [[_COMMUNITY_Assessments & Game Quiz UI]]
- 5 edges to [[_COMMUNITY_Shared Types & Locale]]
- 4 edges to [[_COMMUNITY_Practice & Content Dialogs]]
- 3 edges to [[_COMMUNITY_Marketing Landing Page]]
- 3 edges to [[_COMMUNITY_Learner Dashboard]]
- 3 edges to [[_COMMUNITY_Content Hooks & Status]]
- 2 edges to [[_COMMUNITY_Dashboard Search & Grid]]
- 2 edges to [[_COMMUNITY_App Shells & Navigation]]
- 2 edges to [[_COMMUNITY_Shared UI Primitives]]
- 2 edges to [[_COMMUNITY_Content Panels & Sheets]]
- 2 edges to [[_COMMUNITY_Admin Panel UI]]
- 2 edges to [[_COMMUNITY_Content Stage & Limits]]

## Top bridge nodes
- [[format-relative-time.ts]] - degree 15, connects to 8 communities
- [[tenant-messages-bell.tsx]] - degree 22, connects to 7 communities
- [[formatRelativeTime()]] - degree 17, connects to 6 communities
- [[TenantMessagesBell()]] - degree 6, connects to 2 communities
- [[AssessmentCard()]] - degree 3, connects to 2 communities