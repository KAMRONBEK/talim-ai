---
source_file: "docs/qa/visual-qa-report.md"
type: "rationale"
community: "qa · US-AUTH-04: Change password + tutor/admin"
tags:
  - graphify/rationale
  - graphify/INFERRED
  - community/qa__US-AUTH-04_Change_password__tutor/admin
---

# Stateless-JWT staleness (no tokenVersion on role/password change)

## Connections
- [[F11 (S2, logged) stale session JWT role after admin role-change → tenant 403s until re-login]] - `conceptually_related_to` [INFERRED]
- [[F45 (S2, logged) stale JWT after a role change (tutor approval) — tenant 403 until re-login]] - `conceptually_related_to` [INFERRED]
- [[F46 (S2, logged) no session revocation on password change  logout (stateless JWT, no tokenVersion)]] - `conceptually_related_to` [INFERRED]
- [[US-AUTH-04 Change password + tutoradmin reset + forced first-login change]] - `conceptually_related_to` [INFERRED]
- [[US-AUTH-06 Become-tutor request → admin approval → role unlock]] - `conceptually_related_to` [INFERRED]
- [[US-AUTH-07 Session  JWT lifecycle (expiry, tamper, return-after-login)]] - `conceptually_related_to` [INFERRED]

#graphify/rationale #graphify/INFERRED #community/qa__US-AUTH-04_Change_password__tutor/admin