---
type: community
cohesion: 0.33
members: 6
---

# Usage Pricing

**Cohesion:** 0.33 - loosely connected
**Members:** 6 nodes

## Members
- [[PLAN_MONTHLY_PRICE_USD]] - code - apps/api/src/config/usage-pricing.ts
- [[TOKEN_PRICING_PER_MILLION]] - code - apps/api/src/config/usage-pricing.ts
- [[estimateCost()]] - code - apps/api/src/services/usage.service.ts
- [[estimateTokenCostUsd()]] - code - apps/api/src/config/usage-pricing.ts
- [[planMonthlyPriceUsd()]] - code - apps/api/src/config/usage-pricing.ts
- [[usage-pricing.ts]] - code - apps/api/src/config/usage-pricing.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Usage_Pricing
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_Ingest & Usage Services]]
- 3 edges to [[_COMMUNITY_Admin Analytics]]

## Top bridge nodes
- [[usage-pricing.ts]] - degree 6, connects to 2 communities
- [[estimateTokenCostUsd()]] - degree 4, connects to 2 communities
- [[estimateCost()]] - degree 3, connects to 1 community
- [[planMonthlyPriceUsd()]] - degree 2, connects to 1 community