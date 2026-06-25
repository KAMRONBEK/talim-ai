---
type: community
cohesion: 0.24
members: 13
---

# Admin Tenants Controller

**Cohesion:** 0.24 - loosely connected
**Members:** 13 nodes

## Members
- [[getActiveStudentCount()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getSubscriptionForTenant()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getTenant()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[getTenantContentCount()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getTenantGenerationCount()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getTenantUsageVsLimits()]] - code - apps/api/src/services/subscription/tenant.ts
- [[getUsageForPeriod()]] - code - apps/api/src/services/usage.service.ts
- [[getUser()]] - code - apps/api/src/controllers/admin/users.controller.ts
- [[listTenants()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[patchTenant()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[patchTenantSubscriptionSchema]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[requireActiveTenantSubscription()]] - code - apps/api/src/services/subscription/tenant.ts
- [[tenants.controller.ts]] - code - apps/api/src/controllers/admin/tenants.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Tenants_Controller
SORT file.name ASC
```

## Connections to other communities
- 12 edges to [[_COMMUNITY_Subscription Service]]
- 10 edges to [[_COMMUNITY_Admin Audit & Content Controller]]
- 8 edges to [[_COMMUNITY_Tenant Service & Content Assignment]]
- 6 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 5 edges to [[_COMMUNITY_Tutor-Request & Assessment Controllers]]
- 4 edges to [[_COMMUNITY_Quota Smoke Test]]
- 2 edges to [[_COMMUNITY_AI Summary Generation]]
- 2 edges to [[_COMMUNITY_API Middleware (authquotarate-limit)]]
- 2 edges to [[_COMMUNITY_Tenant-Owner Bootstrap & Role Service]]
- 1 edge to [[_COMMUNITY_Admin Analytics Controller]]
- 1 edge to [[_COMMUNITY_Usage Pricing & PDF Extraction]]

## Top bridge nodes
- [[tenants.controller.ts]] - degree 23, connects to 9 communities
- [[getUsageForPeriod()]] - degree 11, connects to 5 communities
- [[getUser()]] - degree 9, connects to 5 communities
- [[getTenantUsageVsLimits()]] - degree 13, connects to 4 communities
- [[patchTenant()]] - degree 6, connects to 4 communities