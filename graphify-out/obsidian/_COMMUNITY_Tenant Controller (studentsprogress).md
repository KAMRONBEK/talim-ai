---
type: community
cohesion: 0.23
members: 15
---

# Tenant Controller (students/progress)

**Cohesion:** 0.23 - loosely connected
**Members:** 15 nodes

## Members
- [[assignContent()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[createStudent()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[deleteStudent()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[getProgress()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[getStudentProgress()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[getTenant()_1]] - code - apps/api/src/controllers/tenant.controller.ts
- [[listContentAssignments()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[listStudents()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[patchStudent()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[patchTenant()_1]] - code - apps/api/src/controllers/tenant.controller.ts
- [[regenerateJoinCode()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[requireOwnerTenant()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[resetStudentPassword()]] - code - apps/api/src/controllers/tenant.controller.ts
- [[tenant.controller.ts]] - code - apps/api/src/controllers/tenant.controller.ts
- [[unassignContent()]] - code - apps/api/src/controllers/tenant.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant_Controller_students/progress
SORT file.name ASC
```

## Connections to other communities
- 7 edges to [[_COMMUNITY_Tutor-Request & Assessment Controllers]]
- 3 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 2 edges to [[_COMMUNITY_API Middleware (authquotarate-limit)]]
- 1 edge to [[_COMMUNITY_Tenant Service & Content Assignment]]

## Top bridge nodes
- [[tenant.controller.ts]] - degree 22, connects to 4 communities
- [[deleteStudent()]] - degree 3, connects to 1 community
- [[getStudentProgress()]] - degree 3, connects to 1 community
- [[listContentAssignments()]] - degree 3, connects to 1 community
- [[patchStudent()]] - degree 3, connects to 1 community