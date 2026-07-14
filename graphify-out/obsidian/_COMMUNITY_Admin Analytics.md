---
type: community
cohesion: 0.09
members: 36
---

# Admin Analytics

**Cohesion:** 0.09 - loosely connected
**Members:** 36 nodes

## Members
- [[ALL_CONTENT_TYPES]] - code - apps/api/src/services/admin/analytics.service.ts
- [[ALL_ROLES]] - code - apps/api/src/services/admin/analytics.service.ts
- [[AdminAnalyticsSummary]] - code - packages/types/index.ts
- [[AdminChunkSample]] - code - apps/api/src/services/admin/analytics.service.ts
- [[AdminContentByTypeResponse]] - code - packages/types/index.ts
- [[AdminFunnelResponse]] - code - packages/types/index.ts
- [[AdminMrrResponse]] - code - packages/types/index.ts
- [[AdminSpendByModelResponse]] - code - packages/types/index.ts
- [[AdminTopOrgsResponse]] - code - packages/types/index.ts
- [[AdminUserGrowthResponse]] - code - packages/types/index.ts
- [[AdminUsersByRoleResponse]] - code - packages/types/index.ts
- [[analytics.controller.ts]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analytics.service.ts]] - code - apps/api/src/services/admin/analytics.service.ts
- [[analyticsByRole()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analyticsContentByType()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analyticsFunnel()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analyticsMrr()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analyticsSpendByModel()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analyticsSummary()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analyticsTopOrgs()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analyticsUserGrowth()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[computeMrr()]] - code - apps/api/src/services/admin/analytics.service.ts
- [[daysAgo()]] - code - apps/api/src/services/admin/analytics.service.ts
- [[getAnalyticsSummary()]] - code - apps/api/src/services/admin/analytics.service.ts
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
TABLE source_file, type FROM #community/Admin_Analytics
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 8 edges to [[_COMMUNITY_Admin Dashboard & Charts]]
- 6 edges to [[_COMMUNITY_Admin Content & Audit Controllers]]
- 4 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 3 edges to [[_COMMUNITY_Usage Pricing & Metering]]
- 2 edges to [[_COMMUNITY_Subscription & Billing Service]]
- 1 edge to [[_COMMUNITY_API Routes & Middleware]]

## Top bridge nodes
- [[analytics.controller.ts]] - degree 31, connects to 4 communities
- [[analytics.service.ts]] - degree 29, connects to 4 communities
- [[AdminAnalyticsSummary]] - degree 3, connects to 2 communities
- [[AdminContentByTypeResponse]] - degree 3, connects to 2 communities
- [[AdminFunnelResponse]] - degree 3, connects to 2 communities