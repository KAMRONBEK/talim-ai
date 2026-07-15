---
type: community
cohesion: 0.18
members: 11
---

# Tenant Owner Stories

**Cohesion:** 0.18 - loosely connected
**Members:** 11 nodes

## Members
- [[Area Tenant owner students, materials, assignment, settings]] - document - docs/qa/user-stories-expansion.md
- [[US-OWNER-01 Create a student (email, email-less kid, name-only)]] - document - docs/qa/user-stories-expansion.md
- [[US-OWNER-02 Reset a student's password]] - document - docs/qa/user-stories-expansion.md
- [[US-OWNER-03 Deactivate  reactivate (and delete) a student]] - document - docs/qa/user-stories-expansion.md
- [[US-OWNER-04 Regenerate the class join code]] - document - docs/qa/user-stories-expansion.md
- [[US-OWNER-05 Upload  re-read (OCR)  retry a tenant material]] - document - docs/qa/user-stories-expansion.md
- [[US-OWNER-06 Assign  unassign a material to student(s)]] - document - docs/qa/user-stories-expansion.md
- [[US-OWNER-12 (DEEPENED) Delete a material — cascade, mid-generation, IDOR, double-click]] - document - docs/qa/user-stories-expansion.md
- [[US-OWNER-13 Org settings — rename + seat-limit display]] - document - docs/qa/user-stories-expansion.md
- [[US-OWNER-14 Cross-tenant isolation — owner A vs owner B (consolidated IDOR matrix)]] - document - docs/qa/user-stories-expansion.md
- [[US-OWNER-15 Student roster — list, search, seat usage, activity columns]] - document - docs/qa/user-stories-expansion.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant_Owner_Stories
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Cross-Cutting Quality]]

## Top bridge nodes
- [[Area Tenant owner students, materials, assignment, settings]] - degree 11, connects to 1 community