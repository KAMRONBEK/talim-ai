---
type: community
cohesion: 0.13
members: 27
---

# Auth Controller

**Cohesion:** 0.13 - loosely connected
**Members:** 27 nodes

## Members
- [[approveSchema]] - code - apps/api/src/services/tutorRequest.service.ts
- [[approveTutorRequest()_1]] - code - apps/api/src/services/tutorRequest.service.ts
- [[auth.controller.ts]] - code - apps/api/src/controllers/auth.controller.ts
- [[changePassword()]] - code - apps/api/src/controllers/auth.controller.ts
- [[changePasswordSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[createSchema]] - code - apps/api/src/services/tutorRequest.service.ts
- [[createTutorRequest()]] - code - apps/api/src/services/tutorRequest.service.ts
- [[formatRequest()]] - code - apps/api/src/services/tutorRequest.service.ts
- [[formatUser()]] - code - apps/api/src/controllers/auth.controller.ts
- [[getMyLatestTutorRequest()]] - code - apps/api/src/services/tutorRequest.service.ts
- [[getTutorRequest()]] - code - apps/api/src/controllers/auth.controller.ts
- [[joinClass()]] - code - apps/api/src/controllers/auth.controller.ts
- [[joinSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[joinTenantByCode()]] - code - apps/api/src/services/tenant/organization.ts
- [[listTutorRequests()_1]] - code - apps/api/src/services/tutorRequest.service.ts
- [[login()]] - code - apps/api/src/controllers/auth.controller.ts
- [[loginSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[me()]] - code - apps/api/src/controllers/auth.controller.ts
- [[register()]] - code - apps/api/src/controllers/auth.controller.ts
- [[registerSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[registerTenant()]] - code - apps/api/src/controllers/auth.controller.ts
- [[rejectTutorRequest()_1]] - code - apps/api/src/services/tutorRequest.service.ts
- [[signToken()]] - code - apps/api/src/controllers/auth.controller.ts
- [[tutorRequest.service.ts]] - code - apps/api/src/services/tutorRequest.service.ts
- [[updateMe()]] - code - apps/api/src/controllers/auth.controller.ts
- [[updateMeSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[upgradeToTenant()]] - code - apps/api/src/controllers/auth.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Auth_Controller
SORT file.name ASC
```

## Connections to other communities
- 5 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 5 edges to [[_COMMUNITY_Tenant Org & Roles Service]]
- 4 edges to [[_COMMUNITY_API Routes & Middleware]]
- 4 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 2 edges to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 2 edges to [[_COMMUNITY_Admin Content & Audit Controllers]]
- 2 edges to [[_COMMUNITY_Learner Controller]]
- 1 edge to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 1 edge to [[_COMMUNITY_Subscription & Billing Service]]

## Top bridge nodes
- [[auth.controller.ts]] - degree 34, connects to 8 communities
- [[tutorRequest.service.ts]] - degree 16, connects to 4 communities
- [[formatUser()]] - degree 8, connects to 2 communities
- [[joinTenantByCode()]] - degree 5, connects to 2 communities
- [[approveTutorRequest()_1]] - degree 3, connects to 1 community