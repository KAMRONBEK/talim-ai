---
type: community
cohesion: 0.12
members: 28
---

# Auth Controller

**Cohesion:** 0.12 - loosely connected
**Members:** 28 nodes

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
- [[resolveTenantIdForUser()]] - code - apps/api/src/services/contentAccess.service.ts
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
- 8 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 6 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 5 edges to [[_COMMUNITY_Audit & Content Management]]
- 4 edges to [[_COMMUNITY_Assessment Controller]]
- 4 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 3 edges to [[_COMMUNITY_Admin Role Management]]
- 2 edges to [[_COMMUNITY_Content Controller (YouTubeOCR)]]
- 2 edges to [[_COMMUNITY_Tenant Service & Assignments]]
- 2 edges to [[_COMMUNITY_Flashcards & Podcast Controllers]]
- 1 edge to [[_COMMUNITY_Admin Content & Subscriptions]]

## Top bridge nodes
- [[auth.controller.ts]] - degree 34, connects to 8 communities
- [[resolveTenantIdForUser()]] - degree 15, connects to 6 communities
- [[tutorRequest.service.ts]] - degree 16, connects to 4 communities
- [[joinTenantByCode()]] - degree 5, connects to 2 communities
- [[formatUser()]] - degree 8, connects to 1 community