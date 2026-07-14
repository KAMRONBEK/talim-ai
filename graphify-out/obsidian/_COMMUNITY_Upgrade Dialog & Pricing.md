---
type: community
cohesion: 0.20
members: 16
---

# Upgrade Dialog & Pricing

**Cohesion:** 0.20 - loosely connected
**Members:** 16 nodes

## Members
- [[BillingPeriod]] - code - apps/web/lib/pricing.ts
- [[FeatureSpec]] - code - apps/web/lib/pricing.ts
- [[ManualTier]] - code - apps/web/lib/pricing.ts
- [[PRICING_PLANS]] - code - apps/web/lib/pricing.ts
- [[PlanAudience]] - code - apps/web/lib/pricing.ts
- [[PlanLimitsView]] - code - apps/web/lib/pricing.ts
- [[PricingPlan]] - code - apps/web/lib/pricing.ts
- [[UpgradeDialog()]] - code - apps/web/components/account/upgrade-dialog.tsx
- [[effectiveMonthlyUzs()]] - code - apps/web/lib/pricing.ts
- [[formatUzs()]] - code - apps/web/lib/pricing.ts
- [[getPlan()]] - code - apps/web/lib/pricing.ts
- [[planFeatureSpecs()]] - code - apps/web/lib/pricing.ts
- [[plansForAudience()]] - code - apps/web/lib/pricing.ts
- [[pricing.ts]] - code - apps/web/lib/pricing.ts
- [[upgrade-dialog.tsx]] - code - apps/web/components/account/upgrade-dialog.tsx
- [[useRequestUpgrade()]] - code - apps/web/hooks/useBilling.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Upgrade_Dialog__Pricing
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Marketing Landing Components]]
- 2 edges to [[_COMMUNITY_Upgrade Modal & Chat Window]]
- 2 edges to [[_COMMUNITY_Shared UI Primitives]]
- 2 edges to [[_COMMUNITY_Billing & Access Guards]]
- 2 edges to [[_COMMUNITY_Auth & Assignment UI]]
- 2 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 1 edge to [[_COMMUNITY_Shared Types & Zustand Stores]]

## Top bridge nodes
- [[upgrade-dialog.tsx]] - degree 14, connects to 5 communities
- [[pricing.ts]] - degree 17, connects to 3 communities
- [[UpgradeDialog()]] - degree 7, connects to 2 communities
- [[useRequestUpgrade()]] - degree 3, connects to 1 community
- [[PricingPlan]] - degree 2, connects to 1 community