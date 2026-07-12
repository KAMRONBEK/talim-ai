---
type: community
cohesion: 0.22
members: 15
---

# Student Provisioning & CSV

**Cohesion:** 0.22 - loosely connected
**Members:** 15 nodes

## Members
- [[ImportRowInput]] - code - apps/api/src/services/tenant/students.ts
- [[ProvisionStudentParams]] - code - apps/api/src/services/tenant/students.ts
- [[ProvisionStudentResult]] - code - apps/api/src/services/tenant/students.ts
- [[StudentImportRowReport]] - code - apps/api/src/services/tenant/students.ts
- [[createStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[deleteStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[formatStudentRow()]] - code - apps/api/src/services/tenant/shared.ts
- [[generateImportUsername()]] - code - apps/api/src/services/tenant/students.ts
- [[importStudents()_1]] - code - apps/api/src/services/tenant/students.ts
- [[normalizeImportInput()]] - code - apps/api/src/services/tenant/students.ts
- [[parseCsv()]] - code - apps/api/src/services/tenant/students.ts
- [[patchStudent()_1]] - code - apps/api/src/services/tenant/students.ts
- [[provisionStudent()]] - code - apps/api/src/services/tenant/students.ts
- [[resetStudentPassword()_1]] - code - apps/api/src/services/tenant/students.ts
- [[students.ts]] - code - apps/api/src/services/tenant/students.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Student_Provisioning__CSV
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_Billing, Usage & Limits]]
- 5 edges to [[_COMMUNITY_Tenant Service]]
- 2 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 2 edges to [[_COMMUNITY_Learning Coverage & Badges]]

## Top bridge nodes
- [[students.ts]] - degree 27, connects to 4 communities
- [[formatStudentRow()]] - degree 6, connects to 1 community
- [[provisionStudent()]] - degree 5, connects to 1 community
- [[createStudent()_1]] - degree 3, connects to 1 community
- [[patchStudent()_1]] - degree 3, connects to 1 community