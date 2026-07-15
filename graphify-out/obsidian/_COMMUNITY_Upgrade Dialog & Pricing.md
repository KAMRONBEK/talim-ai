---
type: community
cohesion: 0.18
members: 18
---

# Upgrade Dialog & Pricing

**Cohesion:** 0.18 - loosely connected
**Members:** 18 nodes

## Members
- [[.constructor()_2]] - code - apps/api/src/middleware/error.middleware.ts
- [[BillingPeriod]] - code - apps/web/lib/pricing.ts
- [[FeatureSpec]] - code - apps/web/lib/pricing.ts
- [[ManualTier]] - code - apps/web/lib/pricing.ts
- [[PRICING_PLANS]] - code - apps/web/lib/pricing.ts
- [[PlanAudience]] - code - apps/web/lib/pricing.ts
- [[PlanCode]] - code - packages/types/index.ts
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
- 4 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 4 edges to [[_COMMUNITY_Tenant Billing Page]]
- 3 edges to [[_COMMUNITY_Quota Limit Errors]]
- 2 edges to [[_COMMUNITY_Become Tutor & Auth Shell]]
- 2 edges to [[_COMMUNITY_Global Providers & Upgrade Modal]]
- 2 edges to [[_COMMUNITY_Login & Assign Content]]
- 2 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 1 edge to [[_COMMUNITY_Admin Tenant Hooks]]
- 1 edge to [[_COMMUNITY_Subscription Edit Drawer]]
- 1 edge to [[_COMMUNITY_Billing & Profile UI]]
- 1 edge to [[_COMMUNITY_Learner Dashboard]]

## Top bridge nodes
- [[PlanCode]] - degree 13, connects to 6 communities
- [[upgrade-dialog.tsx]] - degree 14, connects to 5 communities
- [[pricing.ts]] - degree 17, connects to 2 communities
- [[UpgradeDialog()]] - degree 7, connects to 2 communities
- [[useRequestUpgrade()]] - degree 3, connects to 1 community