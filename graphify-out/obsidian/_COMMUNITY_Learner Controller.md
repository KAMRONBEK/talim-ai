---
type: community
cohesion: 0.10
members: 37
---

# Learner Controller

**Cohesion:** 0.10 - loosely connected
**Members:** 37 nodes

## Members
- [[SUPPORTED_LOCALES]] - code - packages/types/locale.ts
- [[assignContent()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[createStudent()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[deleteStudent()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[getMaterials()]] - code - apps/api/src/controllers/learner.controller.ts
- [[getProgress()]] - code - apps/api/src/controllers/learner.controller.ts
- [[getProgress()_1]] - code - apps/api/src/controllers/tenant.controller.ts
- [[getProgressTopics()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[getStudentProgress()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[getSummary()]] - code - apps/api/src/controllers/learner.controller.ts
- [[getTenant()_1]] - code - apps/api/src/controllers/tenant.controller.ts
- [[importStudents()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[isAppLocale()]] - code - packages/types/locale.ts
- [[learner.controller.ts]] - code - apps/api/src/controllers/learner.controller.ts
- [[listContentAssignments()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[listMessages()]] - code - apps/api/src/controllers/learner.controller.ts
- [[listSentMessages()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[listStudents()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[locale.ts_1]] - code - packages/types/locale.ts
- [[markMessageRead()]] - code - apps/api/src/controllers/learner.controller.ts
- [[markReplyRead()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[messagesUnreadCount()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[parseAppLocale()]] - code - packages/types/locale.ts
- [[patchStudent()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[patchTenant()_1]] - code - apps/api/src/controllers/tenant.controller.ts
- [[readLocale()]] - code - apps/api/src/controllers/learner.controller.ts
- [[readLocale()_1]] - code - apps/api/src/controllers/tenant.controller.ts
- [[regenerateJoinCode()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[replyToMessage()]] - code - apps/api/src/controllers/learner.controller.ts
- [[requireOwnerTenant()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[requireTenant()_1]] - code - apps/api/src/controllers/learner.controller.ts
- [[resetStudentPassword()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[respondToReply()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[sendMessage()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[tenant.controller.ts]] - code - apps/api/src/controllers/tenant.controller.ts
- [[unassignContent()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[unreadMessageCount()]] - code - apps/api/src/controllers/learner.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Learner_Controller
SORT file.name ASC
```

## Connections to other communities
- 11 edges to [[_COMMUNITY_Assessment Controller]]
- 6 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 4 edges to [[_COMMUNITY_Admin Content & Audit Controllers]]
- 4 edges to [[_COMMUNITY_Content Media Controllers]]
- 4 edges to [[_COMMUNITY_API Routes & Middleware]]
- 4 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 2 edges to [[_COMMUNITY_Auth Controller]]
- 2 edges to [[_COMMUNITY_Tenant Org & Roles Service]]
- 2 edges to [[_COMMUNITY_Job Event Fan-out & Media Jobs]]
- 2 edges to [[_COMMUNITY_Question Bank Service]]
- 2 edges to [[_COMMUNITY_Web API Client & Endpoints]]
- 1 edge to [[_COMMUNITY_Prisma Client & Seed]]
- 1 edge to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 1 edge to [[_COMMUNITY_Podcast Generation & TTS]]
- 1 edge to [[_COMMUNITY_Quiz Generation Pipeline]]
- 1 edge to [[_COMMUNITY_Flashcards UI]]

## Top bridge nodes
- [[parseAppLocale()]] - degree 22, connects to 10 communities
- [[tenant.controller.ts]] - degree 33, connects to 8 communities
- [[learner.controller.ts]] - degree 19, connects to 7 communities
- [[locale.ts_1]] - degree 5, connects to 2 communities
- [[getStudentProgress()]] - degree 4, connects to 1 community