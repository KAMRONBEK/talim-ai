---
type: community
cohesion: 0.24
members: 12
---

# SSE Job Events Bus

**Cohesion:** 0.24 - loosely connected
**Members:** 12 nodes

## Members
- [[.constructor()_3]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[.publish()]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[.replay()]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[.subscribe()]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[InProcessJobEventBus]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[JobEvent]] - code - packages/types/jobEvents.ts
- [[JobEventBus]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[JobEventStatus]] - code - packages/types/jobEvents.ts
- [[SeqJobEvent]] - code - packages/types/jobEvents.ts
- [[UserState]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[jobEvents.service.ts]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[jobEvents.ts]] - code - packages/types/jobEvents.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/SSE_Job_Events_Bus
SORT file.name ASC
```

## Connections to other communities
- 5 edges to [[_COMMUNITY_Bull Jobs & Queues]]
- 5 edges to [[_COMMUNITY_Shared Types & Locale]]
- 2 edges to [[_COMMUNITY_API Routing & Middleware]]
- 1 edge to [[_COMMUNITY_Learner Submission & AI Judge]]
- 1 edge to [[_COMMUNITY_Providers & Job Events]]
- 1 edge to [[_COMMUNITY_Web API Client & Job Stream]]

## Top bridge nodes
- [[jobEvents.service.ts]] - degree 12, connects to 4 communities
- [[JobEvent]] - degree 7, connects to 4 communities
- [[SeqJobEvent]] - degree 7, connects to 2 communities
- [[jobEvents.ts]] - degree 4, connects to 1 community
- [[JobEventStatus]] - degree 2, connects to 1 community