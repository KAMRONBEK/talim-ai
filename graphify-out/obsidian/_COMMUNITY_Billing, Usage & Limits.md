---
type: community
cohesion: 0.08
members: 63
---

# Billing, Usage & Limits

**Cohesion:** 0.08 - loosely connected
**Members:** 63 nodes

## Members
- [[.constructor()]] - code - apps/api/src/middleware/error.middleware.ts
- [[.constructor()_2]] - code - apps/api/src/middleware/error.middleware.ts
- [[.constructor()_1]] - code - apps/api/src/middleware/error.middleware.ts
- [[ApiErrorLike]] - code - apps/web/lib/limit-error.ts
- [[AppError]] - code - apps/api/src/middleware/error.middleware.ts
- [[GENERATION_FEATURES]] - code - apps/api/src/services/subscription/shared.ts
- [[INDIVIDUAL_QUOTA_FEATURES]] - code - apps/web/lib/limit-error.ts
- [[LimitError]] - code - apps/web/lib/limit-error.ts
- [[PlanCode]] - code - packages/types/index.ts
- [[PlanFileLimitError]] - code - apps/api/src/middleware/error.middleware.ts
- [[PlanLimits]] - code - apps/api/src/services/subscription/shared.ts
- [[PricingPlan]] - code - apps/web/lib/pricing.ts
- [[QUOTA_MESSAGES]] - code - apps/api/src/middleware/error.middleware.ts
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
- [[classifyLimitError()]] - code - apps/web/lib/limit-error.ts
- [[dayRange()]] - code - apps/api/src/services/subscription/shared.ts
- [[error.middleware.ts]] - code - apps/api/src/middleware/error.middleware.ts
- [[events.controller.ts]] - code - apps/api/src/controllers/events.controller.ts
- [[expectQuotaError()]] - code - apps/api/src/scripts/smoke-quota.ts
- [[expectQuotaPass()]] - code - apps/api/src/scripts/smoke-quota.ts
- [[formatSubscription()]] - code - apps/api/src/services/subscription/shared.ts
- [[getActiveStudentCount()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getBillingMe()]] - code - apps/api/src/controllers/billing.controller.ts
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
- [[limit-error.ts]] - code - apps/web/lib/limit-error.ts
- [[main()_4]] - code - apps/api/src/scripts/smoke-quota.ts
- [[monthToDateRange()]] - code - apps/api/src/controllers/usage.controller.ts
- [[monthToDateRange()_1]] - code - apps/api/src/services/subscription/shared.ts
- [[parseArgs()_3]] - code - apps/api/src/scripts/smoke-quota.ts
- [[parseLimits()]] - code - apps/api/src/services/subscription/shared.ts
- [[requestUpgrade()]] - code - apps/api/src/controllers/billing.controller.ts
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
TABLE source_file, type FROM #community/Billing_Usage__Limits
SORT file.name ASC
```

## Connections to other communities
- 28 edges to [[_COMMUNITY_Admin Content & Audit]]
- 25 edges to [[_COMMUNITY_Media & Progress Controllers]]
- 23 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 17 edges to [[_COMMUNITY_Content API Controller]]
- 12 edges to [[_COMMUNITY_API Middleware]]
- 10 edges to [[_COMMUNITY_Shared Types & Auth Stores]]
- 8 edges to [[_COMMUNITY_Assessments Service]]
- 8 edges to [[_COMMUNITY_Tenant Service]]
- 8 edges to [[_COMMUNITY_Student Provisioning & CSV]]
- 6 edges to [[_COMMUNITY_Assessment & Tutor-Request Controllers]]
- 6 edges to [[_COMMUNITY_Slide Deck Prompts]]
- 4 edges to [[_COMMUNITY_Providers & Job Events]]
- 4 edges to [[_COMMUNITY_Quiz API Controller]]
- 4 edges to [[_COMMUNITY_Config, Pricing & Embeddings]]
- 4 edges to [[_COMMUNITY_Community 85]]
- 4 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 3 edges to [[_COMMUNITY_Auth API Controller]]
- 3 edges to [[_COMMUNITY_Background Jobs & Queues]]
- 3 edges to [[_COMMUNITY_Community 117]]
- 3 edges to [[_COMMUNITY_Content & Flashcards Hooks]]
- 2 edges to [[_COMMUNITY_Admin Analytics Endpoints]]
- 2 edges to [[_COMMUNITY_AI Tutor Chat API]]
- 2 edges to [[_COMMUNITY_Section Service]]
- 2 edges to [[_COMMUNITY_Tenant Owner Controller]]
- 2 edges to [[_COMMUNITY_Job Registration & Manim]]
- 2 edges to [[_COMMUNITY_Question Banks & Builders]]
- 2 edges to [[_COMMUNITY_Tenant Messaging Service]]
- 1 edge to [[_COMMUNITY_Community 88]]
- 1 edge to [[_COMMUNITY_Admin Users & Tenants UI]]
- 1 edge to [[_COMMUNITY_Subscription Editor UI]]

## Top bridge nodes
- [[error.middleware.ts]] - degree 54, connects to 21 communities
- [[AppError]] - degree 48, connects to 19 communities
- [[subscription.service.ts]] - degree 25, connects to 12 communities
- [[assertQuota()]] - degree 34, connects to 7 communities
- [[tenant.ts]] - degree 29, connects to 6 communities