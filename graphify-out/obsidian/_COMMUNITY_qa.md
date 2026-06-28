---
type: community
cohesion: 0.20
members: 11
---

# qa

**Cohesion:** 0.20 - loosely connected
**Members:** 11 nodes

## Members
- [[F16 (S2, fixed) deactivated login showed 'server unreachable' not 'account deactivated']] - document - docs/qa/visual-qa-report.md
- [[F17 (S2, fixed) emailusername login was case-sensitive — locked users out of a P0 flow]] - document - docs/qa/visual-qa-report.md
- [[F2 (S2, fixed) wrong-password login showed no error — global 401 interceptor wiped inline error]] - document - docs/qa/visual-qa-report.md
- [[F8 (S2, fixed) inaccessible content hung on Loading forever — now redirects to role home]] - document - docs/qa/visual-qa-report.md
- [[Multi-tenant isolation (contentAccess.service.ts  assertCanAccessContent)]] - concept - docs/qa/user-stories.md
- [[US-AUTH-01 Emailpassword login]] - document - docs/qa/user-stories.md
- [[US-LEARNER-01 Sees only assigned materials (isolation)]] - document - docs/qa/user-stories.md
- [[US-LEARNER-03 Deactivated → content access lost immediately]] - document - docs/qa/user-stories.md
- [[US-LEARNER-04 Cannot reach owneradmin tools (role guard)]] - document - docs/qa/user-stories.md
- [[US-LEARNER-08 Reads assigned content as a learner (read allowed, gen blocked)]] - document - docs/qa/user-stories-expansion.md
- [[US-XCUT-04 Multi-tenant isolation matrix — every content + assessment endpoint]] - document - docs/qa/user-stories-expansion.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/qa
SORT file.name ASC
```
