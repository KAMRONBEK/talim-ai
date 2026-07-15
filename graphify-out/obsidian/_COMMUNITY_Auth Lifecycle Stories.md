---
type: community
cohesion: 0.25
members: 8
---

# Auth Lifecycle Stories

**Cohesion:** 0.25 - loosely connected
**Members:** 8 nodes

## Members
- [[Area Auth lifecycle (register, reset, logout, become-tutor, session)]] - document - docs/qa/user-stories-expansion.md
- [[US-AUTH-02 Register a new individual account (+ optional class join code)]] - document - docs/qa/user-stories-expansion.md
- [[US-AUTH-04 Change password + tutoradmin reset + forced first-login change]] - document - docs/qa/user-stories-expansion.md
- [[US-AUTH-05 Logout (clears session, redirect, no back-button re-entry, multi-tab)]] - document - docs/qa/user-stories-expansion.md
- [[US-AUTH-06 Become-tutor request → admin approval → role unlock]] - document - docs/qa/user-stories-expansion.md
- [[US-AUTH-07 Session  JWT lifecycle (expiry, tamper, deleted user, refresh, return-after-login)]] - document - docs/qa/user-stories-expansion.md
- [[US-AUTH-08 Rate limiting on auth endpoints]] - document - docs/qa/user-stories-expansion.md
- [[US-AUTH-09 register-tenant endpoint + role-writenormalization boundaries]] - document - docs/qa/user-stories-expansion.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Auth_Lifecycle_Stories
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Cross-Cutting Quality]]

## Top bridge nodes
- [[Area Auth lifecycle (register, reset, logout, become-tutor, session)]] - degree 8, connects to 1 community