---
type: community
cohesion: 0.10
members: 57
---

# subscription

**Cohesion:** 0.10 - loosely connected
**Members:** 57 nodes

## Members
- [[GENERATION_FEATURES]] - code - apps/api/src/services/subscription/shared.ts
- [[PLANS]] - code - apps/api/src/prisma/seed.ts
- [[PlanLimits]] - code - apps/api/src/services/subscription/shared.ts
- [[PlanSeed]] - code - apps/api/src/prisma/seed.ts
- [[SubscriptionView]] - code - apps/api/src/services/subscription/shared.ts
- [[VIDEO_FEATURE]] - code - apps/api/src/services/subscription/shared.ts
- [[admin.ts]] - code - apps/api/src/services/subscription/admin.ts
- [[adminUpdateUserSubscription()]] - code - apps/api/src/services/subscription/user.ts
- [[assertIndividualPlan()]] - code - apps/api/src/services/subscription/shared.ts
- [[assertQuota()]] - code - apps/api/src/services/subscription/user.ts
- [[assertTenantQuota()]] - code - apps/api/src/services/subscription/tenant.ts
- [[billing.controller.ts]] - code - apps/api/src/controllers/billing.controller.ts
- [[create-admin.ts]] - code - apps/api/src/scripts/create-admin.ts
- [[dayRange()]] - code - apps/api/src/services/subscription/shared.ts
- [[expectQuotaError()]] - code - apps/api/src/scripts/smoke-quota.ts
- [[expectQuotaPass()]] - code - apps/api/src/scripts/smoke-quota.ts
- [[formatSubscription()]] - code - apps/api/src/services/subscription/shared.ts
- [[getActiveStudentCount()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getBillingMe()]] - code - apps/api/src/controllers/billing.controller.ts
- [[getFileLimitsForTenant()]] - code - apps/api/src/services/subscription/tenant.ts
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
- [[main()]] - code - apps/api/src/prisma/seed.ts
- [[main()_1]] - code - apps/api/src/scripts/create-admin.ts
- [[main()_4]] - code - apps/api/src/scripts/smoke-quota.ts
- [[monthToDateRange()_1]] - code - apps/api/src/services/subscription/shared.ts
- [[parseArgs()]] - code - apps/api/src/scripts/create-admin.ts
- [[parseArgs()_3]] - code - apps/api/src/scripts/smoke-quota.ts
- [[parseLimits()]] - code - apps/api/src/services/subscription/shared.ts
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
- [[user.ts]] - code - apps/api/src/services/subscription/user.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/subscription
SORT file.name ASC
```

## Connections to other communities
- 40 edges to [[_COMMUNITY_controllers admin]]
- 25 edges to [[_COMMUNITY_services tenant]]
- 22 edges to [[_COMMUNITY_src controllers]]
- 13 edges to [[_COMMUNITY_src controllers · content.controller.ts]]
- 9 edges to [[_COMMUNITY_src routes]]
- 8 edges to [[_COMMUNITY_src services · slides.controller.ts]]
- 8 edges to [[_COMMUNITY_src jobs]]
- 8 edges to [[_COMMUNITY_src services]]
- 7 edges to [[_COMMUNITY_src services · usage-pricing.ts]]
- 6 edges to [[_COMMUNITY_src services · env.ts]]
- 6 edges to [[_COMMUNITY_assessment · learner.ts]]
- 5 edges to [[_COMMUNITY_packages types]]
- 5 edges to [[_COMMUNITY_src controllers · quiz.controller.ts]]
- 5 edges to [[_COMMUNITY_src controllers · summary.controller.ts]]
- 5 edges to [[_COMMUNITY_src controllers · sendContentFile()]]
- 5 edges to [[_COMMUNITY_web lib · upgrade-dialog.tsx]]
- 4 edges to [[_COMMUNITY_controllers admin · analytics.controller.ts]]
- 4 edges to [[_COMMUNITY_src services · learning-coverage-prompt.ts]]
- 2 edges to [[_COMMUNITY_src controllers · chat.controller.ts]]
- 2 edges to [[_COMMUNITY_src lib · GeneratedQuestion]]
- 2 edges to [[_COMMUNITY_assessment · assessments.ts]]
- 2 edges to [[_COMMUNITY_assessment]]

## Top bridge nodes
- [[prisma.ts]] - degree 56, connects to 20 communities
- [[prisma_2]] - degree 56, connects to 20 communities
- [[subscription.service.ts]] - degree 25, connects to 11 communities
- [[assertQuota()]] - degree 34, connects to 8 communities
- [[user.ts]] - degree 32, connects to 5 communities