---
type: community
cohesion: 0.09
members: 63
---

# Billing & Usage API

**Cohesion:** 0.09 - loosely connected
**Members:** 63 nodes

## Members
- [[.constructor()_2]] - code - apps/api/src/middleware/error.middleware.ts
- [[.constructor()_1]] - code - apps/api/src/middleware/error.middleware.ts
- [[ApiErrorLike]] - code - apps/web/lib/limit-error.ts
- [[GENERATION_FEATURES]] - code - apps/api/src/services/subscription/shared.ts
- [[PlanCode]] - code - packages/types/index.ts
- [[PlanFileLimitError]] - code - apps/api/src/middleware/error.middleware.ts
- [[PlanLimits]] - code - apps/api/src/services/subscription/shared.ts
- [[PricingPlan]] - code - apps/web/lib/pricing.ts
- [[QUOTA_MESSAGES]] - code - apps/api/src/middleware/error.middleware.ts
- [[QuotaExceededError]] - code - apps/api/src/middleware/error.middleware.ts
- [[QuotaFeature]] - code - packages/types/index.ts
- [[SubscriptionView]] - code - apps/api/src/services/subscription/shared.ts
- [[UserSubscription]] - code - packages/types/index.ts
- [[VIDEO_FEATURE]] - code - apps/api/src/services/subscription/shared.ts
- [[admin.ts]] - code - apps/api/src/services/subscription/admin.ts
- [[adminUpdateUserSubscription()]] - code - apps/api/src/services/subscription/user.ts
- [[assertIndividualPlan()]] - code - apps/api/src/services/subscription/shared.ts
- [[assertQuota()]] - code - apps/api/src/services/subscription/user.ts
- [[assertTenantQuota()]] - code - apps/api/src/services/subscription/tenant.ts
- [[billing.controller.ts]] - code - apps/api/src/controllers/billing.controller.ts
- [[dayRange()]] - code - apps/api/src/services/subscription/shared.ts
- [[error.middleware.ts]] - code - apps/api/src/middleware/error.middleware.ts
- [[expectQuotaError()]] - code - apps/api/src/scripts/smoke-quota.ts
- [[expectQuotaPass()]] - code - apps/api/src/scripts/smoke-quota.ts
- [[formatSubscription()]] - code - apps/api/src/services/subscription/shared.ts
- [[getActiveStudentCount()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getBillingMe()]] - code - apps/api/src/controllers/billing.controller.ts
- [[getFileLimitsForTenant()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getFileLimitsForUser()]] - code - apps/api/src/services/subscription/user.ts
- [[getFreePlan()]] - code - apps/api/src/services/subscription/shared.ts
- [[getGenerationCount()]] - code - apps/api/src/services/subscription/user.ts
- [[getMyUsage()]] - code - apps/api/src/controllers/usage.controller.ts
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
- [[monthToDateRange()]] - code - apps/api/src/controllers/usage.controller.ts
- [[monthToDateRange()_1]] - code - apps/api/src/services/subscription/shared.ts
- [[parseArgs()_3]] - code - apps/api/src/scripts/smoke-quota.ts
- [[parseLimits()]] - code - apps/api/src/services/subscription/shared.ts
- [[requestUpgrade()]] - code - apps/api/src/controllers/billing.controller.ts
- [[requireActiveTenantSubscription()]] - code - apps/api/src/services/subscription/tenant.ts
- [[resolveEffectivePlanCode()]] - code - apps/api/src/services/subscription/shared.ts
- [[resolveTenantUpgradePlanCode()]] - code - apps/api/src/services/subscription/tenant.ts
- [[resolveUpgradePlanCode()]] - code - apps/api/src/services/subscription/user.ts
- [[shared.ts_2]] - code - apps/api/src/services/subscription/shared.ts
- [[smoke-quota.ts]] - code - apps/api/src/scripts/smoke-quota.ts
- [[subscription.service.ts]] - code - apps/api/src/services/subscription.service.ts
- [[tenant.ts]] - code - apps/api/src/services/subscription/tenant.ts
- [[usage.controller.ts]] - code - apps/api/src/controllers/usage.controller.ts
- [[user.ts]] - code - apps/api/src/services/subscription/user.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Billing__Usage_API
SORT file.name ASC
```

## Connections to other communities
- 43 edges to [[_COMMUNITY_Tenant Admin & Prisma]]
- 18 edges to [[_COMMUNITY_Admin Analytics & Subscriptions]]
- 16 edges to [[_COMMUNITY_Content & Podcast API]]
- 16 edges to [[_COMMUNITY_Content Controller]]
- 13 edges to [[_COMMUNITY_Admin Audit & Auth]]
- 8 edges to [[_COMMUNITY_Slide Deck Types]]
- 5 edges to [[_COMMUNITY_Quiz Controller]]
- 5 edges to [[_COMMUNITY_Section & Summary API]]
- 4 edges to [[_COMMUNITY_Usage Pricing & Chunk Tools]]
- 4 edges to [[_COMMUNITY_Env Config & Jobs]]
- 4 edges to [[_COMMUNITY_Deck Prompt Builder]]
- 3 edges to [[_COMMUNITY_Community 51]]
- 3 edges to [[_COMMUNITY_Community 53]]
- 3 edges to [[_COMMUNITY_Community 36]]
- 2 edges to [[_COMMUNITY_Admin PlanStatus UI]]
- 1 edge to [[_COMMUNITY_Community 62]]
- 1 edge to [[_COMMUNITY_Community 48]]
- 1 edge to [[_COMMUNITY_Community 63]]
- 1 edge to [[_COMMUNITY_Community 87]]
- 1 edge to [[_COMMUNITY_Community 46]]

## Top bridge nodes
- [[error.middleware.ts]] - degree 50, connects to 16 communities
- [[subscription.service.ts]] - degree 24, connects to 9 communities
- [[assertQuota()]] - degree 32, connects to 7 communities
- [[billing.controller.ts]] - degree 15, connects to 4 communities
- [[PlanCode]] - degree 12, connects to 4 communities