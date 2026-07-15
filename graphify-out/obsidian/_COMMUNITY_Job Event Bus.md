---
type: community
cohesion: 0.29
members: 11
---

# Job Event Bus

**Cohesion:** 0.29 - loosely connected
**Members:** 11 nodes

## Members
- [[.constructor()_3]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[.publish()]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[.replay()]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[.subscribe()]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[InProcessJobEventBus]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[JobEvent]] - code - packages/types/jobEvents.ts
- [[SeqJobEvent]] - code - packages/types/jobEvents.ts
- [[UserState]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[events.controller.ts]] - code - apps/api/src/controllers/events.controller.ts
- [[jobEvents]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[jobEvents.service.ts]] - code - apps/api/src/services/events/jobEvents.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Job_Event_Bus
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 6 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 2 edges to [[_COMMUNITY_Assessment Controller]]
- 2 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 2 edges to [[_COMMUNITY_Assessment Service]]
- 2 edges to [[_COMMUNITY_Manim Video & Job Stream]]
- 1 edge to [[_COMMUNITY_Audit & Content Management]]

## Top bridge nodes
- [[events.controller.ts]] - degree 10, connects to 5 communities
- [[jobEvents.service.ts]] - degree 11, connects to 3 communities
- [[JobEvent]] - degree 7, connects to 3 communities
- [[jobEvents]] - degree 6, connects to 2 communities
- [[SeqJobEvent]] - degree 7, connects to 1 community