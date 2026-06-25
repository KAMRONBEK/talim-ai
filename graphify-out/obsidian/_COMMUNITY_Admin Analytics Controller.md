---
type: community
cohesion: 0.29
members: 8
---

# Admin Analytics Controller

**Cohesion:** 0.29 - loosely connected
**Members:** 8 nodes

## Members
- [[admin.controller.ts]] - code - apps/api/src/controllers/admin.controller.ts
- [[analytics.controller.ts]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[listSubscriptions()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[listSubscriptionsForAdmin()]] - code - apps/api/src/services/subscription/admin.ts
- [[platformStats()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[subscriptionListSchema]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[usageDaysSchema]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[usageSummary()]] - code - apps/api/src/controllers/admin/analytics.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Analytics_Controller
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_Admin Audit & Content Controller]]
- 2 edges to [[_COMMUNITY_API Middleware (authquotarate-limit)]]
- 2 edges to [[_COMMUNITY_AI Summary Generation]]
- 2 edges to [[_COMMUNITY_Subscription Service]]
- 1 edge to [[_COMMUNITY_Admin Tenants Controller]]
- 1 edge to [[_COMMUNITY_LearnerSectionUsage Controllers]]

## Top bridge nodes
- [[analytics.controller.ts]] - degree 14, connects to 5 communities
- [[admin.controller.ts]] - degree 5, connects to 3 communities
- [[listSubscriptionsForAdmin()]] - degree 3, connects to 1 community