---
type: community
cohesion: 0.20
members: 10
---

# docs · Become-a-tutor request flow

**Cohesion:** 0.20 - loosely connected
**Members:** 10 nodes

## Members
- [[Become-a-tutor request flow]] - concept - docs/FEATURES.md
- [[Class JOIN CODE self-enroll]] - concept - docs/FEATURES.md
- [[Custom seat limit]] - concept - docs/FEATURES.md
- [[Rate limiting]] - concept - docs/FEATURES.md
- [[Signup  login by email OR username]] - concept - docs/FEATURES.md
- [[Students management (email + email-less username students)]] - concept - docs/FEATURES.md
- [[Tenant dashboard & org settings]] - concept - docs/FEATURES.md
- [[Tenant management + subscriptions]] - concept - docs/FEATURES.md
- [[Tutor-request approvals (org + subscription + seat limit)]] - concept - docs/FEATURES.md
- [[mustChangePassword & password reset]] - concept - docs/FEATURES.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/docs__Become-a-tutor_request_flow
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_docs]]

## Top bridge nodes
- [[Tutor-request approvals (org + subscription + seat limit)]] - degree 3, connects to 1 community