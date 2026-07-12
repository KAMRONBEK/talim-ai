---
type: community
cohesion: 0.08
members: 67
---

# Admin Tenants API

**Cohesion:** 0.08 - loosely connected
**Members:** 67 nodes

## Members
- [[GENERATION_FEATURES]] - code - apps/api/src/services/subscription/shared.ts
- [[PLANS]] - code - apps/api/src/prisma/seed.ts
- [[PlanLimits]] - code - apps/api/src/services/subscription/shared.ts
- [[PlanSeed]] - code - apps/api/src/prisma/seed.ts
- [[SubscriptionView]] - code - apps/api/src/services/subscription/shared.ts
- [[VIDEO_FEATURE]] - code - apps/api/src/services/subscription/shared.ts
- [[admin.ts]] - code - apps/api/src/services/subscription/admin.ts
- [[adminUpdateTenantSubscription()]] - code - apps/api/src/services/subscription/tenant.ts
- [[adminUpdateUserSubscription()]] - code - apps/api/src/services/subscription/user.ts
- [[assertIndividualPlan()]] - code - apps/api/src/services/subscription/shared.ts
- [[assertQuota()]] - code - apps/api/src/services/subscription/user.ts
- [[assertTenantQuota()]] - code - apps/api/src/services/subscription/tenant.ts
- [[billing.controller.ts]] - code - apps/api/src/controllers/billing.controller.ts
- [[create-admin.ts]] - code - apps/api/src/scripts/create-admin.ts
- [[create-tenant-owner.ts]] - code - apps/api/src/scripts/create-tenant-owner.ts
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
- [[listTenants()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[main()]] - code - apps/api/src/prisma/seed.ts
- [[main()_1]] - code - apps/api/src/scripts/create-admin.ts
- [[main()_2]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[main()_4]] - code - apps/api/src/scripts/smoke-quota.ts
- [[monthToDateRange()_1]] - code - apps/api/src/services/subscription/shared.ts
- [[parseArgs()]] - code - apps/api/src/scripts/create-admin.ts
- [[parseArgs()_1]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[parseArgs()_3]] - code - apps/api/src/scripts/smoke-quota.ts
- [[parseLimits()]] - code - apps/api/src/services/subscription/shared.ts
- [[patchTenant()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[patchTenantSubscriptionSchema]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[patchUserSubscription()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[prisma_2]] - code - apps/api/src/lib/prisma.ts
- [[prisma.ts]] - code - apps/api/src/lib/prisma.ts
- [[requestUpgrade()]] - code - apps/api/src/controllers/billing.controller.ts
- [[requireActiveTenantSubscription()]] - code - apps/api/src/services/subscription/tenant.ts
- [[resolveEffectivePlanCode()]] - code - apps/api/src/services/subscription/shared.ts
- [[resolveTenantUpgradePlanCode()]] - code - apps/api/src/services/subscription/tenant.ts
- [[resolveUpgradePlanCode()]] - code - apps/api/src/services/subscription/user.ts
- [[seed.ts]] - code - apps/api/src/prisma/seed.ts
- [[shared.ts_2]] - code - apps/api/src/services/subscription/shared.ts
- [[smoke-quota.ts]] - code - apps/api/src/scripts/smoke-quota.ts
- [[subscription.service.ts]] - code - apps/api/src/services/subscription.service.ts
- [[tenant.ts]] - code - apps/api/src/services/subscription/tenant.ts
- [[tenants.controller.ts]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[user.ts]] - code - apps/api/src/services/subscription/user.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Tenants_API
SORT file.name ASC
```

## Connections to other communities
- 30 edges to [[_COMMUNITY_Flashcards API]]
- 22 edges to [[_COMMUNITY_Admin Content & Audit]]
- 22 edges to [[_COMMUNITY_Podcast API]]
- 17 edges to [[_COMMUNITY_Assessment API Controllers]]
- 13 edges to [[_COMMUNITY_Admin & Events Controllers]]
- 13 edges to [[_COMMUNITY_Community 67]]
- 10 edges to [[_COMMUNITY_Community 32]]
- 8 edges to [[_COMMUNITY_Assessments Service]]
- 8 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 7 edges to [[_COMMUNITY_Community 49]]
- 7 edges to [[_COMMUNITY_Community 75]]
- 6 edges to [[_COMMUNITY_Admin Analytics]]
- 6 edges to [[_COMMUNITY_Flashcards Generation & Jobs]]
- 6 edges to [[_COMMUNITY_Community 71]]
- 5 edges to [[_COMMUNITY_Shared Types]]
- 5 edges to [[_COMMUNITY_Community 56]]
- 5 edges to [[_COMMUNITY_Slide Deck Prompts]]
- 5 edges to [[_COMMUNITY_Community 60]]
- 4 edges to [[_COMMUNITY_Community 85]]
- 3 edges to [[_COMMUNITY_Community 65]]
- 2 edges to [[_COMMUNITY_AI Tutor Chat API]]
- 2 edges to [[_COMMUNITY_Podcast Generation & Prompts]]
- 2 edges to [[_COMMUNITY_Quiz Generation Job]]
- 2 edges to [[_COMMUNITY_Community 83]]
- 2 edges to [[_COMMUNITY_Community 46]]
- 2 edges to [[_COMMUNITY_Community 57]]
- 2 edges to [[_COMMUNITY_Community 77]]

## Top bridge nodes
- [[prisma.ts]] - degree 63, connects to 26 communities
- [[prisma_2]] - degree 63, connects to 26 communities
- [[subscription.service.ts]] - degree 25, connects to 12 communities
- [[assertQuota()]] - degree 34, connects to 8 communities
- [[tenants.controller.ts]] - degree 23, connects to 6 communities