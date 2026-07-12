---
type: community
cohesion: 0.08
members: 58
---

# Admin Tenants & Prisma Core

**Cohesion:** 0.08 - loosely connected
**Members:** 58 nodes

## Members
- [[.constructor()]] - code - apps/api/src/middleware/error.middleware.ts
- [[AdminRoleChangeInput]] - code - apps/api/src/services/adminUserRole.service.ts
- [[AppError]] - code - apps/api/src/middleware/error.middleware.ts
- [[AuthPayload]] - code - apps/api/src/middleware/auth.middleware.ts
- [[FlashcardGrade]] - code - apps/api/src/services/srs.service.ts
- [[FlashcardReviewResult]] - code - apps/api/src/services/srs.service.ts
- [[GRADE_QUALITY]] - code - apps/api/src/services/srs.service.ts
- [[PLANS]] - code - apps/api/src/prisma/seed.ts
- [[PlanFileLimitError]] - code - apps/api/src/middleware/error.middleware.ts
- [[PlanSeed]] - code - apps/api/src/prisma/seed.ts
- [[QUOTA_MESSAGES]] - code - apps/api/src/middleware/error.middleware.ts
- [[adminUpdateTenantSubscription()]] - code - apps/api/src/services/subscription/tenant.ts
- [[adminUserRole.service.ts]] - code - apps/api/src/services/adminUserRole.service.ts
- [[applyAdminRoleChange()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[approveSchema]] - code - apps/api/src/services/tutorRequest.service.ts
- [[assignContent()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[assignmentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[assignments.ts]] - code - apps/api/src/services/tenant/assignments.ts
- [[contentAccess.service.ts]] - code - apps/api/src/services/contentAccess.service.ts
- [[create-admin.ts]] - code - apps/api/src/scripts/create-admin.ts
- [[create-tenant-owner.ts]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[createSchema]] - code - apps/api/src/services/tutorRequest.service.ts
- [[createTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[ensureIndividualSubscription()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[ensureTenantSubscription()]] - code - apps/api/src/services/tenant/organization.ts
- [[error.middleware.ts]] - code - apps/api/src/middleware/error.middleware.ts
- [[formatTenant()]] - code - apps/api/src/services/tenant/shared.ts
- [[generateUniqueJoinCode()]] - code - apps/api/src/services/tenant/shared.ts
- [[getDefaultTenantPlanId()]] - code - apps/api/src/services/tenant/shared.ts
- [[getTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[listContentAssignments()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[listTenants()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[listTutorRequests()_1]] - code - apps/api/src/services/tutorRequest.service.ts
- [[main()]] - code - apps/api/src/prisma/seed.ts
- [[main()_1]] - code - apps/api/src/scripts/create-admin.ts
- [[main()_2]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[organization.ts]] - code - apps/api/src/services/tenant/organization.ts
- [[parseArgs()]] - code - apps/api/src/scripts/create-admin.ts
- [[parseArgs()_1]] - code - apps/api/src/scripts/create-tenant-owner.ts
- [[patchTenant()]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[patchTenantForOwner()]] - code - apps/api/src/services/tenant/organization.ts
- [[patchTenantSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[patchTenantSubscriptionSchema]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[prisma_2]] - code - apps/api/src/lib/prisma.ts
- [[prisma.ts]] - code - apps/api/src/lib/prisma.ts
- [[randomJoinCode()]] - code - apps/api/src/services/tenant/shared.ts
- [[regenerateJoinCode()_1]] - code - apps/api/src/services/tenant/organization.ts
- [[seed.ts]] - code - apps/api/src/prisma/seed.ts
- [[shared.ts_3]] - code - apps/api/src/services/tenant/shared.ts
- [[slugifyOrgName()]] - code - apps/api/src/lib/tenant-slug.ts
- [[srs.service.ts]] - code - apps/api/src/services/srs.service.ts
- [[tenant-slug.ts]] - code - apps/api/src/lib/tenant-slug.ts
- [[tenant.service.ts]] - code - apps/api/src/services/tenant.service.ts
- [[tenants.controller.ts]] - code - apps/api/src/controllers/admin/tenants.controller.ts
- [[transferTenantOwnership()]] - code - apps/api/src/services/adminUserRole.service.ts
- [[tutorRequest.service.ts]] - code - apps/api/src/services/tutorRequest.service.ts
- [[unassignContent()_1]] - code - apps/api/src/services/tenant/assignments.ts
- [[uniqueSlug()]] - code - apps/api/src/services/tenant/shared.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Tenants__Prisma_Core
SORT file.name ASC
```

## Connections to other communities
- 41 edges to [[_COMMUNITY_Content API Controllers]]
- 34 edges to [[_COMMUNITY_Billing & Quota]]
- 22 edges to [[_COMMUNITY_Admin Content & Audit]]
- 21 edges to [[_COMMUNITY_Admin & Usage Controllers]]
- 16 edges to [[_COMMUNITY_Content Upload & Ingest]]
- 16 edges to [[_COMMUNITY_Assessments Service]]
- 14 edges to [[_COMMUNITY_Community 47]]
- 14 edges to [[_COMMUNITY_Env Config & Job Events]]
- 11 edges to [[_COMMUNITY_AI Tutor Chat API]]
- 9 edges to [[_COMMUNITY_Community 69]]
- 8 edges to [[_COMMUNITY_Community 80]]
- 5 edges to [[_COMMUNITY_Community 58]]
- 5 edges to [[_COMMUNITY_Community 92]]
- 5 edges to [[_COMMUNITY_Community 73]]
- 4 edges to [[_COMMUNITY_Community 29]]
- 4 edges to [[_COMMUNITY_Community 50]]
- 4 edges to [[_COMMUNITY_Community 59]]
- 4 edges to [[_COMMUNITY_Slide Deck Prompts]]
- 3 edges to [[_COMMUNITY_Community 93]]
- 3 edges to [[_COMMUNITY_Community 48]]
- 2 edges to [[_COMMUNITY_Community 56]]
- 2 edges to [[_COMMUNITY_Community 63]]
- 2 edges to [[_COMMUNITY_Podcast Generation & TTS]]
- 2 edges to [[_COMMUNITY_Community 51]]
- 2 edges to [[_COMMUNITY_Community 107]]
- 2 edges to [[_COMMUNITY_Community 43]]
- 2 edges to [[_COMMUNITY_Community 49]]
- 1 edge to [[_COMMUNITY_Shared Types & Chat Hooks]]

## Top bridge nodes
- [[prisma.ts]] - degree 63, connects to 23 communities
- [[prisma_2]] - degree 63, connects to 23 communities
- [[error.middleware.ts]] - degree 54, connects to 21 communities
- [[AppError]] - degree 48, connects to 18 communities
- [[contentAccess.service.ts]] - degree 31, connects to 9 communities