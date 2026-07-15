---
type: community
cohesion: 0.10
members: 23
---

# Analytics & Usage Pricing

**Cohesion:** 0.10 - loosely connected
**Members:** 23 nodes

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
- [[PLAN_MONTHLY_PRICE_USD]] - code - apps/api/src/config/usage-pricing.ts
- [[TOKEN_PRICING_PER_MILLION]] - code - apps/api/src/config/usage-pricing.ts
- [[analytics.service.ts]] - code - apps/api/src/services/admin/analytics.service.ts
- [[analyticsMrr()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analyticsSummary()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[computeMrr()]] - code - apps/api/src/services/admin/analytics.service.ts
- [[daysAgo()]] - code - apps/api/src/services/admin/analytics.service.ts
- [[estimateCost()]] - code - apps/api/src/services/usage.service.ts
- [[estimateTokenCostUsd()]] - code - apps/api/src/config/usage-pricing.ts
- [[getAnalyticsSummary()]] - code - apps/api/src/services/admin/analytics.service.ts
- [[planMonthlyPriceUsd()]] - code - apps/api/src/config/usage-pricing.ts
- [[usage-pricing.ts]] - code - apps/api/src/config/usage-pricing.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Analytics__Usage_Pricing
SORT file.name ASC
```

## Connections to other communities
- 11 edges to [[_COMMUNITY_Analytics Controller]]
- 9 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 8 edges to [[_COMMUNITY_Admin Content Page]]
- 4 edges to [[_COMMUNITY_Embedding & Chunk Inspection]]
- 2 edges to [[_COMMUNITY_Audit & Content Management]]
- 2 edges to [[_COMMUNITY_Env Config & Background Jobs]]

## Top bridge nodes
- [[analytics.service.ts]] - degree 29, connects to 4 communities
- [[AdminAnalyticsSummary]] - degree 3, connects to 2 communities
- [[AdminContentByTypeResponse]] - degree 3, connects to 2 communities
- [[AdminFunnelResponse]] - degree 3, connects to 2 communities
- [[AdminMrrResponse]] - degree 3, connects to 2 communities