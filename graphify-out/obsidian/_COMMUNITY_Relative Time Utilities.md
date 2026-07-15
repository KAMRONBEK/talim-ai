---
type: community
cohesion: 0.25
members: 9
---

# Relative Time Utilities

**Cohesion:** 0.25 - loosely connected
**Members:** 9 nodes

## Members
- [[AssessmentCard()]] - code - apps/web/app/[locale]/(learner)/learner/assessments/page.tsx
- [[LOCALE_MAP]] - code - apps/web/lib/format-relative-time.ts
- [[ResponseBubble()]] - code - apps/web/components/tenant/tenant-messages-bell.tsx
- [[ThreadBubble()]] - code - apps/web/components/learner/learner-messages-bell.tsx
- [[UNITS]] - code - apps/web/lib/format-relative-time.ts
- [[UZ_UNIT_LABELS]] - code - apps/web/lib/format-relative-time.ts
- [[format-relative-time.ts]] - code - apps/web/lib/format-relative-time.ts
- [[formatRelativeTime()]] - code - apps/web/lib/format-relative-time.ts
- [[formatUzbek()]] - code - apps/web/lib/format-relative-time.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Relative_Time_Utilities
SORT file.name ASC
```

## Connections to other communities
- 7 edges to [[_COMMUNITY_Tenant Messages & Progress]]
- 4 edges to [[_COMMUNITY_Learner Dashboard]]
- 4 edges to [[_COMMUNITY_Login & Assign Content]]
- 3 edges to [[_COMMUNITY_Game Quiz Player]]
- 3 edges to [[_COMMUNITY_Tenant Assessments Page]]
- 2 edges to [[_COMMUNITY_Content Status UI]]
- 2 edges to [[_COMMUNITY_API Endpoints & Chat UI]]
- 1 edge to [[_COMMUNITY_Admin Content & Subscriptions]]
- 1 edge to [[_COMMUNITY_Flashcards Page]]

## Top bridge nodes
- [[format-relative-time.ts]] - degree 15, connects to 9 communities
- [[formatRelativeTime()]] - degree 17, connects to 7 communities
- [[AssessmentCard()]] - degree 3, connects to 2 communities
- [[ThreadBubble()]] - degree 3, connects to 2 communities
- [[ResponseBubble()]] - degree 2, connects to 1 community