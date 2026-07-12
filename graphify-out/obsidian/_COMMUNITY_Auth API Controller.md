---
type: community
cohesion: 0.17
members: 20
---

# Auth API Controller

**Cohesion:** 0.17 - loosely connected
**Members:** 20 nodes

## Members
- [[auth.controller.ts]] - code - apps/api/src/controllers/auth.controller.ts
- [[changePassword()]] - code - apps/api/src/controllers/auth.controller.ts
- [[changePasswordSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[createTutorRequest()]] - code - apps/api/src/services/tutorRequest.service.ts
- [[formatUser()]] - code - apps/api/src/controllers/auth.controller.ts
- [[getMyLatestTutorRequest()]] - code - apps/api/src/services/tutorRequest.service.ts
- [[getTutorRequest()]] - code - apps/api/src/controllers/auth.controller.ts
- [[joinClass()]] - code - apps/api/src/controllers/auth.controller.ts
- [[joinSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[joinTenantByCode()]] - code - apps/api/src/services/tenant/organization.ts
- [[login()]] - code - apps/api/src/controllers/auth.controller.ts
- [[loginSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[me()]] - code - apps/api/src/controllers/auth.controller.ts
- [[register()]] - code - apps/api/src/controllers/auth.controller.ts
- [[registerSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[registerTenant()]] - code - apps/api/src/controllers/auth.controller.ts
- [[signToken()]] - code - apps/api/src/controllers/auth.controller.ts
- [[updateMe()]] - code - apps/api/src/controllers/auth.controller.ts
- [[updateMeSchema]] - code - apps/api/src/controllers/auth.controller.ts
- [[upgradeToTenant()]] - code - apps/api/src/controllers/auth.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Auth_API_Controller
SORT file.name ASC
```

## Connections to other communities
- 5 edges to [[_COMMUNITY_Community 85]]
- 4 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 3 edges to [[_COMMUNITY_Admin Content & Audit]]
- 3 edges to [[_COMMUNITY_Billing, Usage & Limits]]
- 2 edges to [[_COMMUNITY_Config, Pricing & Embeddings]]
- 2 edges to [[_COMMUNITY_Tenant Service]]
- 2 edges to [[_COMMUNITY_Community 98]]
- 1 edge to [[_COMMUNITY_Shared Types & Auth Stores]]
- 1 edge to [[_COMMUNITY_API Middleware]]

## Top bridge nodes
- [[auth.controller.ts]] - degree 34, connects to 9 communities
- [[formatUser()]] - degree 8, connects to 2 communities
- [[joinTenantByCode()]] - degree 5, connects to 2 communities
- [[createTutorRequest()]] - degree 4, connects to 1 community
- [[getMyLatestTutorRequest()]] - degree 4, connects to 1 community