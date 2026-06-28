---
type: community
cohesion: 0.33
members: 7
---

# controllers admin · analytics.controller.ts

**Cohesion:** 0.33 - loosely connected
**Members:** 7 nodes

## Members
- [[analytics.controller.ts]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[listSubscriptions()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[listSubscriptionsForAdmin()]] - code - apps/api/src/services/subscription/admin.ts
- [[platformStats()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[subscriptionListSchema]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[usageDaysSchema]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[usageSummary()]] - code - apps/api/src/controllers/admin/analytics.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/controllers_admin__analyticscontrollerts
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_subscription]]
- 3 edges to [[_COMMUNITY_controllers admin]]
- 2 edges to [[_COMMUNITY_src routes]]

## Top bridge nodes
- [[analytics.controller.ts]] - degree 14, connects to 3 communities
- [[listSubscriptionsForAdmin()]] - degree 3, connects to 1 community