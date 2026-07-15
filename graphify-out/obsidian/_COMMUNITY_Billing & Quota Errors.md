---
type: community
cohesion: 0.11
members: 54
---

# Billing & Quota Errors

**Cohesion:** 0.11 - loosely connected
**Members:** 54 nodes

## Members
- [[.constructor()]] - code - apps/api/src/middleware/error.middleware.ts
- [[AppError]] - code - apps/api/src/middleware/error.middleware.ts
- [[GENERATION_FEATURES]] - code - apps/api/src/services/subscription/shared.ts
- [[PlanFileLimitError]] - code - apps/api/src/middleware/error.middleware.ts
- [[PlanLimits]] - code - apps/api/src/services/subscription/shared.ts
- [[QUOTA_MESSAGES]] - code - apps/api/src/middleware/error.middleware.ts
- [[QuotaExceededError]] - code - apps/api/src/middleware/error.middleware.ts
- [[SubscriptionView]] - code - apps/api/src/services/subscription/shared.ts
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
TABLE source_file, type FROM #community/Billing__Quota_Errors
SORT file.name ASC
```

## Connections to other communities
- 32 edges to [[_COMMUNITY_Audit & Content Management]]
- 28 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 26 edges to [[_COMMUNITY_Flashcards & Podcast Controllers]]
- 23 edges to [[_COMMUNITY_Content Controller (YouTubeOCR)]]
- 9 edges to [[_COMMUNITY_Tenant Service & Assignments]]
- 9 edges to [[_COMMUNITY_Assessment Controller]]
- 8 edges to [[_COMMUNITY_Assessment Service]]
- 8 edges to [[_COMMUNITY_Student Import Service]]
- 6 edges to [[_COMMUNITY_Auth Controller]]
- 6 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 6 edges to [[_COMMUNITY_Summary Controller]]
- 5 edges to [[_COMMUNITY_Quota Limit Errors]]
- 4 edges to [[_COMMUNITY_Quiz Controller]]
- 4 edges to [[_COMMUNITY_Upgrade Dialog & Pricing]]
- 4 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 3 edges to [[_COMMUNITY_Embedding & Chunk Inspection]]
- 2 edges to [[_COMMUNITY_Analytics Controller]]
- 2 edges to [[_COMMUNITY_Chat Controller (SSE)]]
- 2 edges to [[_COMMUNITY_Job Event Bus]]
- 2 edges to [[_COMMUNITY_Learner API Controller]]
- 2 edges to [[_COMMUNITY_Tenant Student Management]]
- 2 edges to [[_COMMUNITY_Bank & Question Management]]
- 2 edges to [[_COMMUNITY_Admin Role Management]]
- 2 edges to [[_COMMUNITY_Tenant Messaging Service]]

## Top bridge nodes
- [[error.middleware.ts]] - degree 56, connects to 22 communities
- [[AppError]] - degree 50, connects to 19 communities
- [[subscription.service.ts]] - degree 25, connects to 10 communities
- [[assertQuota()]] - degree 35, connects to 6 communities
- [[tenant.ts]] - degree 29, connects to 6 communities