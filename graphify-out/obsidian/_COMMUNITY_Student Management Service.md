---
type: community
cohesion: 0.18
members: 17
---

# Student Management Service

**Cohesion:** 0.18 - loosely connected
**Members:** 17 nodes

## Members
- [[ImportRowInput]] - code - apps/api/src/services/tenant/students.ts
- [[ProvisionStudentParams]] - code - apps/api/src/services/tenant/students.ts
- [[ProvisionStudentResult]] - code - apps/api/src/services/tenant/students.ts
- [[StudentImportRowReport]] - code - apps/api/src/services/tenant/students.ts
- [[createStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[createStudentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[deleteStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[formatStudentRow()]] - code - apps/api/src/services/tenant/shared.ts
- [[generateImportUsername()]] - code - apps/api/src/services/tenant/students.ts
- [[importStudents()_1]] - code - apps/api/src/services/tenant/students.ts
- [[normalizeImportInput()]] - code - apps/api/src/services/tenant/students.ts
- [[parseCsv()]] - code - apps/api/src/services/tenant/students.ts
- [[patchStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[patchStudentSchema]] - code - apps/api/src/services/tenant/shared.ts
- [[provisionStudent()]] - code - apps/api/src/services/tenant/students.ts
- [[resetStudentPassword()_1]] - code - apps/api/src/services/tenant/students.ts
- [[students.ts]] - code - apps/api/src/services/tenant/students.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Student_Management_Service
SORT file.name ASC
```

## Connections to other communities
- 5 edges to [[_COMMUNITY_Subscription & Billing Service]]
- 5 edges to [[_COMMUNITY_Tenant Org & Roles Service]]
- 4 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 3 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]

## Top bridge nodes
- [[students.ts]] - degree 27, connects to 4 communities
- [[formatStudentRow()]] - degree 6, connects to 1 community
- [[provisionStudent()]] - degree 5, connects to 1 community
- [[createStudent()_1]] - degree 3, connects to 1 community
- [[patchStudent()_1]] - degree 3, connects to 1 community