---
type: community
cohesion: 0.09
members: 31
---

# Admin Analytics

**Cohesion:** 0.09 - loosely connected
**Members:** 31 nodes

## Members
- [[ALL_CONTENT_TYPES]] - code - apps/api/src/services/admin/analytics.service.ts
- [[ALL_ROLES]] - code - apps/api/src/services/admin/analytics.service.ts
- [[AdminAnalyticsSummary]] - code - packages/types/index.ts
- [[AdminAuditLogItem]] - code - packages/types/index.ts
- [[AdminChunkSample]] - code - apps/api/src/services/admin/analytics.service.ts
- [[AdminContentByTypeResponse]] - code - packages/types/index.ts
- [[AdminContentDetail]] - code - packages/types/index.ts
- [[AdminContentItem]] - code - packages/types/index.ts
- [[AdminFunnelResponse]] - code - packages/types/index.ts
- [[AdminGeneratedItem]] - code - packages/types/index.ts
- [[AdminGeneratedReview]] - code - packages/types/index.ts
- [[AdminImpersonateResponse]] - code - packages/types/index.ts
- [[AdminMrrResponse]] - code - packages/types/index.ts
- [[AdminPlatformStats]] - code - packages/types/index.ts
- [[AdminSpendByModelResponse]] - code - packages/types/index.ts
- [[AdminTopOrgsResponse]] - code - packages/types/index.ts
- [[AdminUpdateSubscriptionInput]] - code - packages/types/index.ts
- [[AdminUsageSummaryRow]] - code - packages/types/index.ts
- [[AdminUserGrowthResponse]] - code - packages/types/index.ts
- [[AdminUsersByRoleResponse]] - code - packages/types/index.ts
- [[PaginatedResponse]] - code - packages/types/index.ts
- [[UsagePage()]] - code - apps/admin/app/(admin)/usage/page.tsx
- [[analytics.service.ts]] - code - apps/api/src/services/admin/analytics.service.ts
- [[analyticsMrr()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[analyticsSummary()]] - code - apps/api/src/controllers/admin/analytics.controller.ts
- [[computeMrr()]] - code - apps/api/src/services/admin/analytics.service.ts
- [[daysAgo()]] - code - apps/api/src/services/admin/analytics.service.ts
- [[getAnalyticsSummary()]] - code - apps/api/src/services/admin/analytics.service.ts
- [[page.tsx_8]] - code - apps/admin/app/(admin)/usage/page.tsx
- [[useAdmin.ts]] - code - apps/admin/hooks/useAdmin.ts
- [[useAdminUsage()]] - code - apps/admin/hooks/useAdmin.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Analytics
SORT file.name ASC
```

## Connections to other communities
- 26 edges to [[_COMMUNITY_Shared Types & Auth Stores]]
- 11 edges to [[_COMMUNITY_Admin Analytics Endpoints]]
- 10 edges to [[_COMMUNITY_Admin Dashboard UI]]
- 8 edges to [[_COMMUNITY_Shared UI Primitives]]
- 8 edges to [[_COMMUNITY_Admin Users & Tenants UI]]
- 5 edges to [[_COMMUNITY_Subscription Editor UI]]
- 4 edges to [[_COMMUNITY_Community 104]]
- 4 edges to [[_COMMUNITY_Community 110]]
- 3 edges to [[_COMMUNITY_Community 103]]
- 3 edges to [[_COMMUNITY_Community 88]]
- 3 edges to [[_COMMUNITY_Config, Pricing & Embeddings]]
- 2 edges to [[_COMMUNITY_Admin Content & Audit]]
- 2 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 1 edge to [[_COMMUNITY_Account & Settings UI]]
- 1 edge to [[_COMMUNITY_Content Grid & Learner Dashboard]]

## Top bridge nodes
- [[useAdmin.ts]] - degree 72, connects to 10 communities
- [[analytics.service.ts]] - degree 29, connects to 5 communities
- [[page.tsx_8]] - degree 5, connects to 2 communities
- [[getAnalyticsSummary()]] - degree 5, connects to 1 community
- [[computeMrr()]] - degree 4, connects to 1 community