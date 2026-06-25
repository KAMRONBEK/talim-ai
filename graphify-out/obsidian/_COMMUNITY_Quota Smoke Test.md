---
type: community
cohesion: 0.29
members: 10
---

# Quota Smoke Test

**Cohesion:** 0.29 - loosely connected
**Members:** 10 nodes

## Members
- [[expectQuotaError()]] - code - apps/api/src/scripts/smoke-quota.ts
- [[expectQuotaPass()]] - code - apps/api/src/scripts/smoke-quota.ts
- [[getBillingMe()]] - code - apps/api/src/controllers/billing.controller.ts
- [[getGenerationCount()]] - code - apps/api/src/services/subscription/user.ts
- [[getTutorMessageCount()]] - code - apps/api/src/services/subscription/user.ts
- [[getUploadCount()]] - code - apps/api/src/services/subscription/user.ts
- [[getUsageVsLimits()]] - code - apps/api/src/services/subscription/user.ts
- [[main()_4]] - code - apps/api/src/scripts/smoke-quota.ts
- [[parseArgs()_3]] - code - apps/api/src/scripts/smoke-quota.ts
- [[smoke-quota.ts]] - code - apps/api/src/scripts/smoke-quota.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Quota_Smoke_Test
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_Subscription Service]]
- 5 edges to [[_COMMUNITY_Podcast & Progress Controllers]]
- 4 edges to [[_COMMUNITY_Admin Tenants Controller]]
- 3 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 2 edges to [[_COMMUNITY_AI Summary Generation]]
- 1 edge to [[_COMMUNITY_Admin Audit & Content Controller]]

## Top bridge nodes
- [[getUsageVsLimits()]] - degree 13, connects to 4 communities
- [[smoke-quota.ts]] - degree 10, connects to 4 communities
- [[getBillingMe()]] - degree 4, connects to 3 communities
- [[getGenerationCount()]] - degree 4, connects to 3 communities
- [[getTutorMessageCount()]] - degree 3, connects to 2 communities