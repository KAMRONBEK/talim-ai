---
type: community
cohesion: 0.11
members: 53
---

# Billing & Quota

**Cohesion:** 0.11 - loosely connected
**Members:** 53 nodes

## Members
- [[.constructor()_1]] - code - apps/api/src/middleware/error.middleware.ts
- [[GENERATION_FEATURES]] - code - apps/api/src/services/subscription/shared.ts
- [[PlanLimits]] - code - apps/api/src/services/subscription/shared.ts
- [[QuotaExceededError]] - code - apps/api/src/middleware/error.middleware.ts
- [[QuotaFeature]] - code - packages/types/index.ts
- [[SubscriptionView]] - code - apps/api/src/services/subscription/shared.ts
- [[VIDEO_FEATURE]] - code - apps/api/src/services/subscription/shared.ts
- [[admin.ts]] - code - apps/api/src/services/subscription/admin.ts
- [[adminUpdateUserSubscription()]] - code - apps/api/src/services/subscription/user.ts
- [[assertIndividualPlan()]] - code - apps/api/src/services/subscription/shared.ts
- [[assertQuota()]] - code - apps/api/src/services/subscription/user.ts
- [[assertTenantQuota()]] - code - apps/api/src/services/subscription/tenant.ts
- [[billing.controller.ts]] - code - apps/api/src/controllers/billing.controller.ts
- [[dayRange()]] - code - apps/api/src/services/subscription/shared.ts
- [[expectQuotaError()]] - code - apps/api/src/scripts/smoke-quota.ts
- [[expectQuotaPass()]] - code - apps/api/src/scripts/smoke-quota.ts
- [[formatSubscription()]] - code - apps/api/src/services/subscription/shared.ts
- [[getActiveStudentCount()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getBillingMe()]] - code - apps/api/src/controllers/billing.controller.ts
- [[getFileLimitsForTenant()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getFileLimitsForUser()]] - code - apps/api/src/services/subscription/user.ts
- [[getFreePlan()]] - code - apps/api/src/services/subscription/shared.ts
- [[getGenerationCount()]] - code - apps/api/src/services/subscription/user.ts
- [[getPodcastCount()]] - code - apps/api/src/services/subscription/user.ts
- [[getSubscriptionForTenant()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getSubscriptionForUser()]] - code - apps/api/src/services/subscription/user.ts
- [[getTenant()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[getTenantContentCount()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getTenantGenerationCount()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getTenantPodcastCount()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getTenantUsageVsLimits()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getTenantVideoCount()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getTutorMessageCount()]] - code - apps/api/src/services/subscription/user.ts
- [[getUploadCount()]] - code - apps/api/src/services/subscription/user.ts
- [[getUsageForPeriod()]] - code - apps/api/src/services/usage.service.ts
- [[getUsageVsLimits()]] - code - apps/api/src/services/subscription/user.ts
- [[getUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[getVideoCount()]] - code - apps/api/src/services/subscription/user.ts
- [[main()_4]] - code - apps/api/src/scripts/smoke-quota.ts
- [[monthToDateRange()_1]] - code - apps/api/src/services/subscription/shared.ts
- [[parseArgs()_3]] - code - apps/api/src/scripts/smoke-quota.ts
- [[parseLimits()]] - code - apps/api/src/services/subscription/shared.ts
- [[patchUserSubscription()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[requestUpgrade()]] - code - apps/api/src/controllers/billing.controller.ts
- [[requireActiveTenantSubscription()]] - code - apps/api/src/services/subscription/tenant.ts
- [[resolveEffectivePlanCode()]] - code - apps/api/src/services/subscription/shared.ts
- [[resolveTenantUpgradePlanCode()]] - code - apps/api/src/services/subscription/tenant.ts
- [[resolveUpgradePlanCode()]] - code - apps/api/src/services/subscription/user.ts
- [[shared.ts_2]] - code - apps/api/src/services/subscription/shared.ts
- [[smoke-quota.ts]] - code - apps/api/src/scripts/smoke-quota.ts
- [[subscription.service.ts]] - code - apps/api/src/services/subscription.service.ts
- [[tenant.ts]] - code - apps/api/src/services/subscription/tenant.ts
- [[user.ts]] - code - apps/api/src/services/subscription/user.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Billing__Quota
SORT file.name ASC
```

## Connections to other communities
- 34 edges to [[_COMMUNITY_Admin Tenants & Prisma Core]]
- 20 edges to [[_COMMUNITY_Content API Controllers]]
- 12 edges to [[_COMMUNITY_Content Upload & Ingest]]
- 11 edges to [[_COMMUNITY_Admin Content & Audit]]
- 9 edges to [[_COMMUNITY_Admin & Usage Controllers]]
- 6 edges to [[_COMMUNITY_Shared Types & Chat Hooks]]
- 6 edges to [[_COMMUNITY_Community 69]]
- 4 edges to [[_COMMUNITY_Community 49]]
- 3 edges to [[_COMMUNITY_Slide Deck Prompts]]
- 3 edges to [[_COMMUNITY_Community 50]]
- 2 edges to [[_COMMUNITY_Community 56]]
- 2 edges to [[_COMMUNITY_Community 58]]
- 2 edges to [[_COMMUNITY_Env Config & Job Events]]
- 1 edge to [[_COMMUNITY_Community 47]]
- 1 edge to [[_COMMUNITY_Community 38]]

## Top bridge nodes
- [[subscription.service.ts]] - degree 25, connects to 10 communities
- [[assertQuota()]] - degree 34, connects to 6 communities
- [[QuotaFeature]] - degree 9, connects to 5 communities
- [[user.ts]] - degree 32, connects to 4 communities
- [[tenant.ts]] - degree 29, connects to 4 communities