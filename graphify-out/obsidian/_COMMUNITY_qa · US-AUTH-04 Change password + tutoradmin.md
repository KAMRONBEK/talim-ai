---
type: community
cohesion: 0.31
members: 9
---

# qa · US-AUTH-04: Change password + tutor/admin

**Cohesion:** 0.31 - loosely connected
**Members:** 9 nodes

## Members
- [[F11 (S2, logged) stale session JWT role after admin role-change → tenant 403s until re-login]] - document - docs/qa/visual-qa-report.md
- [[F14 (S3, logged) return-after-login not preserved (no redirect= param)]] - document - docs/qa/visual-qa-report.md
- [[F45 (S2, logged) stale JWT after a role change (tutor approval) — tenant 403 until re-login]] - document - docs/qa/visual-qa-report.md
- [[F46 (S2, logged) no session revocation on password change  logout (stateless JWT, no tokenVersion)]] - document - docs/qa/visual-qa-report.md
- [[Stateless-JWT staleness (no tokenVersion on rolepassword change)]] - rationale - docs/qa/visual-qa-report.md
- [[US-AUTH-04 Change password + tutoradmin reset + forced first-login change]] - document - docs/qa/user-stories-expansion.md
- [[US-AUTH-05 Logout (clears session, redirect, no back-button re-entry)]] - document - docs/qa/user-stories-expansion.md
- [[US-AUTH-06 Become-tutor request → admin approval → role unlock]] - document - docs/qa/user-stories-expansion.md
- [[US-AUTH-07 Session  JWT lifecycle (expiry, tamper, return-after-login)]] - document - docs/qa/user-stories-expansion.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/qa__US-AUTH-04_Change_password__tutor/admin
SORT file.name ASC
```
