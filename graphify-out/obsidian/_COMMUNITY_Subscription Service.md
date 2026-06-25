---
type: community
cohesion: 0.31
members: 17
---

# Subscription Service

**Cohesion:** 0.31 - loosely connected
**Members:** 17 nodes

## Members
- [[GENERATION_FEATURES]] - code - apps/api/src/services/subscription/shared.ts
- [[PlanLimits]] - code - apps/api/src/services/subscription/shared.ts
- [[SubscriptionView]] - code - apps/api/src/services/subscription/shared.ts
- [[admin.ts]] - code - apps/api/src/services/subscription/admin.ts
- [[adminUpdateUserSubscription()]] - code - apps/api/src/services/subscription/user.ts
- [[assertIndividualPlan()]] - code - apps/api/src/services/subscription/shared.ts
- [[formatSubscription()]] - code - apps/api/src/services/subscription/shared.ts
- [[getFreePlan()]] - code - apps/api/src/services/subscription/shared.ts
- [[getSubscriptionForUser()]] - code - apps/api/src/services/subscription/user.ts
- [[monthToDateRange()_1]] - code - apps/api/src/services/subscription/shared.ts
- [[parseLimits()]] - code - apps/api/src/services/subscription/shared.ts
- [[resolveEffectivePlanCode()]] - code - apps/api/src/services/subscription/shared.ts
- [[resolveUpgradePlanCode()]] - code - apps/api/src/services/subscription/user.ts
- [[shared.ts_2]] - code - apps/api/src/services/subscription/shared.ts
- [[subscription.service.ts]] - code - apps/api/src/services/subscription.service.ts
- [[tenant.ts]] - code - apps/api/src/services/subscription/tenant.ts
- [[user.ts]] - code - apps/api/src/services/subscription/user.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Subscription_Service
SORT file.name ASC
```

## Connections to other communities
- 16 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 12 edges to [[_COMMUNITY_Admin Tenants Controller]]
- 9 edges to [[_COMMUNITY_AI Summary Generation]]
- 8 edges to [[_COMMUNITY_Quota Smoke Test]]
- 7 edges to [[_COMMUNITY_Podcast & Progress Controllers]]
- 6 edges to [[_COMMUNITY_Tenant Service & Content Assignment]]
- 4 edges to [[_COMMUNITY_Admin Audit & Content Controller]]
- 3 edges to [[_COMMUNITY_Tenant-Owner Bootstrap & Role Service]]
- 3 edges to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 2 edges to [[_COMMUNITY_Admin Analytics Controller]]
- 2 edges to [[_COMMUNITY_Usage Pricing & PDF Extraction]]
- 1 edge to [[_COMMUNITY_Content Controller (B2C)]]
- 1 edge to [[_COMMUNITY_Quiz Controller & Grading]]
- 1 edge to [[_COMMUNITY_Tenant Content Controller]]
- 1 edge to [[_COMMUNITY_Env Config & Background Job Registration]]
- 1 edge to [[_COMMUNITY_API Middleware (authquotarate-limit)]]
- 1 edge to [[_COMMUNITY_AI Slide-Deck Prompting]]

## Top bridge nodes
- [[subscription.service.ts]] - degree 24, connects to 15 communities
- [[user.ts]] - degree 29, connects to 8 communities
- [[tenant.ts]] - degree 26, connects to 7 communities
- [[getSubscriptionForUser()]] - degree 10, connects to 5 communities
- [[monthToDateRange()_1]] - degree 7, connects to 4 communities