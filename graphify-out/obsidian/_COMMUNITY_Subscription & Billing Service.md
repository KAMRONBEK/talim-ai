---
type: community
cohesion: 0.12
members: 44
---

# Subscription & Billing Service

**Cohesion:** 0.12 - loosely connected
**Members:** 44 nodes

## Members
- [[GENERATION_FEATURES]] - code - apps/api/src/services/subscription/shared.ts
- [[PlanLimits]] - code - apps/api/src/services/subscription/shared.ts
- [[SubscriptionView]] - code - apps/api/src/services/subscription/shared.ts
- [[UserSubscription]] - code - packages/types/index.ts
- [[VIDEO_FEATURE]] - code - apps/api/src/services/subscription/shared.ts
- [[admin.ts]] - code - apps/api/src/services/subscription/admin.ts
- [[adminUpdateUserSubscription()]] - code - apps/api/src/services/subscription/user.ts
- [[assertIndividualPlan()]] - code - apps/api/src/services/subscription/shared.ts
- [[assertTenantQuota()]] - code - apps/api/src/services/subscription/tenant.ts
- [[billing.controller.ts]] - code - apps/api/src/controllers/billing.controller.ts
- [[dayRange()]] - code - apps/api/src/services/subscription/shared.ts
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
- [[monthToDateRange()_1]] - code - apps/api/src/services/subscription/shared.ts
- [[parseLimits()]] - code - apps/api/src/services/subscription/shared.ts
- [[requestUpgrade()]] - code - apps/api/src/controllers/billing.controller.ts
- [[requireActiveTenantSubscription()]] - code - apps/api/src/services/subscription/tenant.ts
- [[resolveEffectivePlanCode()]] - code - apps/api/src/services/subscription/shared.ts
- [[resolveTenantUpgradePlanCode()]] - code - apps/api/src/services/subscription/tenant.ts
- [[resolveUpgradePlanCode()]] - code - apps/api/src/services/subscription/user.ts
- [[shared.ts_2]] - code - apps/api/src/services/subscription/shared.ts
- [[subscription.service.ts]] - code - apps/api/src/services/subscription.service.ts
- [[tenant.ts]] - code - apps/api/src/services/subscription/tenant.ts
- [[user.ts]] - code - apps/api/src/services/subscription/user.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Subscription__Billing_Service
SORT file.name ASC
```

## Connections to other communities
- 19 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 17 edges to [[_COMMUNITY_Admin Content & Audit Controllers]]
- 14 edges to [[_COMMUNITY_Content Media Controllers]]
- 10 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 7 edges to [[_COMMUNITY_Tenant Org & Roles Service]]
- 6 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 5 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 5 edges to [[_COMMUNITY_Student Management Service]]
- 4 edges to [[_COMMUNITY_API Routes & Middleware]]
- 3 edges to [[_COMMUNITY_Usage Pricing & Metering]]
- 2 edges to [[_COMMUNITY_Admin Analytics]]
- 2 edges to [[_COMMUNITY_Assessment Controller]]
- 1 edge to [[_COMMUNITY_Quiz Controller & Grading]]
- 1 edge to [[_COMMUNITY_Summary Controller]]
- 1 edge to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 1 edge to [[_COMMUNITY_Job Event Fan-out & Media Jobs]]
- 1 edge to [[_COMMUNITY_Auth Controller]]

## Top bridge nodes
- [[subscription.service.ts]] - degree 25, connects to 12 communities
- [[user.ts]] - degree 32, connects to 5 communities
- [[tenant.ts]] - degree 29, connects to 5 communities
- [[billing.controller.ts]] - degree 15, connects to 5 communities
- [[assertTenantQuota()]] - degree 17, connects to 4 communities