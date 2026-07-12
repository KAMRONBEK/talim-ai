---
type: community
cohesion: 0.15
members: 19
---

# Admin Analytics Endpoints

**Cohesion:** 0.15 - loosely connected
**Members:** 19 nodes

## Members
- [[analytics.controller.ts]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analyticsByRole()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analyticsContentByType()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analyticsFunnel()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analyticsSpendByModel()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analyticsTopOrgs()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analyticsUserGrowth()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[getContentByType()]] - code - apps/api/src/services/admin/analytics.service.ts
- [[getFunnel()]] - code - apps/api/src/services/admin/analytics.service.ts
- [[getSpendByModel()]] - code - apps/api/src/services/admin/analytics.service.ts
- [[getTopOrgs()]] - code - apps/api/src/services/admin/analytics.service.ts
- [[getUserGrowth()]] - code - apps/api/src/services/admin/analytics.service.ts
- [[getUsersByRole()]] - code - apps/api/src/services/admin/analytics.service.ts
- [[listSubscriptions()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[listSubscriptionsForAdmin()]] - code - apps/api/src/services/subscription/admin.ts
- [[platformStats()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[subscriptionListSchema]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[usageDaysSchema]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[usageSummary()]] - code - apps/api/src/controllers/admin/analytics.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Analytics_Endpoints
SORT file.name ASC
```

## Connections to other communities
- 11 edges to [[_COMMUNITY_Admin Analytics]]
- 4 edges to [[_COMMUNITY_Admin Content & Audit]]
- 3 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 2 edges to [[_COMMUNITY_Billing, Usage & Limits]]

## Top bridge nodes
- [[analytics.controller.ts]] - degree 31, connects to 4 communities
- [[getContentByType()]] - degree 3, connects to 1 community
- [[getFunnel()]] - degree 3, connects to 1 community
- [[getSpendByModel()]] - degree 3, connects to 1 community
- [[getTopOrgs()]] - degree 3, connects to 1 community