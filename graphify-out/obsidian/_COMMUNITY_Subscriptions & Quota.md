---
type: community
cohesion: 0.10
members: 56
---

# Subscriptions & Quota

**Cohesion:** 0.10 - loosely connected
**Members:** 56 nodes

## Members
- [[.constructor()]] - code - apps/api/src/middleware/error.middleware.ts
- [[AppError]] - code - apps/api/src/middleware/error.middleware.ts
- [[GENERATION_FEATURES]] - code - apps/api/src/services/subscription/shared.ts
- [[PlanFileLimitError]] - code - apps/api/src/middleware/error.middleware.ts
- [[PlanLimits]] - code - apps/api/src/services/subscription/shared.ts
- [[QUOTA_MESSAGES]] - code - apps/api/src/middleware/error.middleware.ts
- [[QuotaExceededError]] - code - apps/api/src/middleware/error.middleware.ts
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
- [[getSubscriptionForUser()]] - code - apps/api/src/services/subscription/user.ts
- [[getTenantContentCount()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getTenantGenerationCount()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getTenantPodcastCount()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getTenantUsageVsLimits()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getTenantVideoCount()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getTutorMessageCount()]] - code - apps/api/src/services/subscription/user.ts
- [[getUploadCount()]] - code - apps/api/src/services/subscription/user.ts
- [[getUsageForPeriod()]] - code - apps/api/src/services/usage.service.ts
- [[getUsageVsLimits()]] - code - apps/api/src/services/subscription/user.ts
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
TABLE source_file, type FROM #community/Subscriptions__Quota
SORT file.name ASC
```

## Connections to other communities
- 27 edges to [[_COMMUNITY_Admin API Controllers]]
- 27 edges to [[_COMMUNITY_Content Access & Media API]]
- 26 edges to [[_COMMUNITY_Auth & Tenant Services]]
- 19 edges to [[_COMMUNITY_Bull Jobs & Queues]]
- 17 edges to [[_COMMUNITY_API Routing & Middleware]]
- 16 edges to [[_COMMUNITY_Content Controllers]]
- 10 edges to [[_COMMUNITY_Slide Deck Generation]]
- 9 edges to [[_COMMUNITY_Pricing & Upgrade Flow]]
- 6 edges to [[_COMMUNITY_Shared Types & Locale]]
- 6 edges to [[_COMMUNITY_AI Summary & Ingest]]
- 6 edges to [[_COMMUNITY_Assessment Services]]
- 4 edges to [[_COMMUNITY_Quiz API]]
- 4 edges to [[_COMMUNITY_Tenant Progress & Mastery]]
- 4 edges to [[_COMMUNITY_Ingest & Usage Services]]
- 2 edges to [[_COMMUNITY_Admin Analytics]]
- 2 edges to [[_COMMUNITY_Chat Streaming API]]
- 2 edges to [[_COMMUNITY_Question Bank Builders]]
- 2 edges to [[_COMMUNITY_Learner Submission & AI Judge]]
- 2 edges to [[_COMMUNITY_Learning Progress Service]]
- 2 edges to [[_COMMUNITY_Messaging Service]]

## Top bridge nodes
- [[error.middleware.ts]] - degree 55, connects to 18 communities
- [[AppError]] - degree 49, connects to 16 communities
- [[subscription.service.ts]] - degree 25, connects to 10 communities
- [[assertQuota()]] - degree 35, connects to 7 communities
- [[tenant.ts]] - degree 29, connects to 6 communities