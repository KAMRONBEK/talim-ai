---
type: community
cohesion: 0.31
members: 8
---

# QA Traceability Ledger

**Cohesion:** 0.31 - loosely connected
**Members:** 8 nodes

## Members
- [[Multi-tenant isolation guard (contentAccess.service  assertCanAccessContent)]] - concept - docs/qa/user-stories.md
- [[O80 ASCII apostrophe (U+0027) vs Uzbek U+02BB in o'g']] - concept - docs/qa/user-stories.md
- [[Observations Ledger (O-numbers)]] - concept - docs/qa/user-stories.md
- [[US-IND-05 Podcast generate + player]] - concept - docs/qa/user-stories.md
- [[US-LEARNER-01 Learner sees only assigned materials]] - concept - docs/qa/user-stories.md
- [[US-LEARNER-04 Learner blocked from owneradmin tools]] - concept - docs/qa/user-stories.md
- [[US-XCUT-01 i18n — Uzbek-first localization]] - concept - docs/qa/user-stories.md
- [[User Stories & QA Traceability (durable spec + results ledger)]] - document - docs/qa/user-stories.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/QA_Traceability_Ledger
SORT file.name ASC
```

## Connections to other communities
- 6 edges to [[_COMMUNITY_QA Deferred Bug Reports]]
- 2 edges to [[_COMMUNITY_Product Plan Epics]]
- 1 edge to [[_COMMUNITY_Bug Tracking & Accounts]]

## Top bridge nodes
- [[User Stories & QA Traceability (durable spec + results ledger)]] - degree 8, connects to 3 communities
- [[O80 ASCII apostrophe (U+0027) vs Uzbek U+02BB in o'g']] - degree 4, connects to 1 community
- [[Observations Ledger (O-numbers)]] - degree 4, connects to 1 community
- [[US-LEARNER-01 Learner sees only assigned materials]] - degree 4, connects to 1 community
- [[Multi-tenant isolation guard (contentAccess.service  assertCanAccessContent)]] - degree 2, connects to 1 community