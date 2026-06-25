---
type: community
cohesion: 0.17
members: 21
---

# Learner/Section/Usage Controllers

**Cohesion:** 0.17 - loosely connected
**Members:** 21 nodes

## Members
- [[.constructor()]] - code - apps/api/src/middleware/error.middleware.ts
- [[.constructor()_1]] - code - apps/api/src/middleware/error.middleware.ts
- [[AppError]] - code - apps/api/src/middleware/error.middleware.ts
- [[AuthenticatedRequest]] - code - apps/api/src/middleware/auth.middleware.ts
- [[PlanCode]] - code - packages/types/index.ts
- [[QUOTA_MESSAGES]] - code - apps/api/src/middleware/error.middleware.ts
- [[QuotaExceededError]] - code - apps/api/src/middleware/error.middleware.ts
- [[QuotaFeature]] - code - packages/types/index.ts
- [[billing.controller.ts]] - code - apps/api/src/controllers/billing.controller.ts
- [[ensureSectionTitlesForLocale()]] - code - apps/api/src/services/section.service.ts
- [[error.middleware.ts]] - code - apps/api/src/middleware/error.middleware.ts
- [[formatSection()]] - code - apps/api/src/controllers/section.controller.ts
- [[getMyUsage()]] - code - apps/api/src/controllers/usage.controller.ts
- [[getSection()]] - code - apps/api/src/controllers/section.controller.ts
- [[getSummary()]] - code - apps/api/src/controllers/learner.controller.ts
- [[learner.controller.ts]] - code - apps/api/src/controllers/learner.controller.ts
- [[listSections()]] - code - apps/api/src/controllers/section.controller.ts
- [[monthToDateRange()]] - code - apps/api/src/controllers/usage.controller.ts
- [[resolveSectionTitle()]] - code - apps/api/src/services/section.service.ts
- [[section.controller.ts]] - code - apps/api/src/controllers/section.controller.ts
- [[usage.controller.ts]] - code - apps/api/src/controllers/usage.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Learner/Section/Usage_Controllers
SORT file.name ASC
```

## Connections to other communities
- 19 edges to [[_COMMUNITY_Podcast & Progress Controllers]]
- 18 edges to [[_COMMUNITY_API Middleware (authquotarate-limit)]]
- 16 edges to [[_COMMUNITY_Subscription Service]]
- 11 edges to [[_COMMUNITY_AI Summary Generation]]
- 10 edges to [[_COMMUNITY_Tutor-Request & Assessment Controllers]]
- 9 edges to [[_COMMUNITY_Tenant Service & Content Assignment]]
- 7 edges to [[_COMMUNITY_Admin Audit & Content Controller]]
- 6 edges to [[_COMMUNITY_Admin Tenants Controller]]
- 6 edges to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 6 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 6 edges to [[_COMMUNITY_Assessment Service]]
- 5 edges to [[_COMMUNITY_Auth Controller (loginjoinpassword)]]
- 4 edges to [[_COMMUNITY_Learning Progress & Coverage Scoring]]
- 3 edges to [[_COMMUNITY_Quota Smoke Test]]
- 3 edges to [[_COMMUNITY_Chat Controller & Sessions]]
- 3 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 3 edges to [[_COMMUNITY_Tenant Content Controller]]
- 3 edges to [[_COMMUNITY_Tenant Controller (studentsprogress)]]
- 3 edges to [[_COMMUNITY_AI Slide-Deck Prompting]]
- 2 edges to [[_COMMUNITY_Env Config & Background Job Registration]]
- 2 edges to [[_COMMUNITY_AI Question Banks]]
- 2 edges to [[_COMMUNITY_Learner Assessment Service]]
- 2 edges to [[_COMMUNITY_Tenant-Owner Bootstrap & Role Service]]
- 1 edge to [[_COMMUNITY_Tenant Detail UI]]
- 1 edge to [[_COMMUNITY_Admin TenantUser Detail UI]]
- 1 edge to [[_COMMUNITY_Admin Analytics Controller]]
- 1 edge to [[_COMMUNITY_TTS Normalization Service]]
- 1 edge to [[_COMMUNITY_Usage Pricing & PDF Extraction]]

## Top bridge nodes
- [[error.middleware.ts]] - degree 48, connects to 22 communities
- [[AppError]] - degree 43, connects to 20 communities
- [[AuthenticatedRequest]] - degree 26, connects to 13 communities
- [[section.controller.ts]] - degree 23, connects to 7 communities
- [[billing.controller.ts]] - degree 12, connects to 5 communities