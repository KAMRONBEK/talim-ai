---
type: community
cohesion: 0.40
members: 5
---

# qa · US-ADMIN-03: Admin user management (role 

**Cohesion:** 0.40 - moderately connected
**Members:** 5 nodes

## Members
- [[F25 (S2, fixed) admin user-detail credential fields silently browser-autofilled (leak)]] - document - docs/qa/visual-qa-report.md
- [[F37 (S2, fixed) admin cancel of an individual subscription rewrote planId→FREE (paid plan lost)]] - document - docs/qa/visual-qa-report.md
- [[F51 (S2, fixed) PATCH adminusersid did not audit non-role edits (namelocalenote)]] - document - docs/qa/visual-qa-report.md
- [[F9 (S2, fixed) every admin page SSR-500'd from auth-guard hydration init]] - document - docs/qa/visual-qa-report.md
- [[US-ADMIN-03 Admin user management (role change  reset-pw  delete  patch sub)]] - document - docs/qa/user-stories-expansion.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/qa__US-ADMIN-03_Admin_user_management_role_
SORT file.name ASC
```
