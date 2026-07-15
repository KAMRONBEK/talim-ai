---
type: community
cohesion: 0.29
members: 16
---

# QA Deferred Bug Reports

**Cohesion:** 0.29 - loosely connected
**Members:** 16 nodes

## Members
- [[F39 GAME leaderboard timing is client-supplied (responseMs)]] - concept - docs/qa/user-stories.md
- [[F59 Quiz generation failure spun forever (no persisted Quiz.status)]] - concept - docs/qa/user-stories.md
- [[F63 PDF region-select opened a duplicate Learn panel on desktop]] - concept - docs/qa/user-stories.md
- [[F76 Due-date hint said 'does not block submission' but server 403s]] - concept - docs/qa/user-stories.md
- [[F77 Assessment re-assign silently no-ops on already-assigned learners]] - concept - docs/qa/user-stories.md
- [[F78 FLAGGED generated media is label-only (never hidden from learners)]] - concept - docs/qa/user-stories.md
- [[F79 CSV formula injection on students-roster export (CWE-1236)]] - concept - docs/qa/user-stories.md
- [[Findings ledger]] - document - docs/qa/user-stories.md
- [[GAME speed-points cheat clamp (computeGamePoints)]] - rationale - docs/qa/visual-qa-report.md
- [[Impersonation security matrix (admin mint → act-as-user)]] - concept - docs/qa/visual-qa-report.md
- [[O81 Impersonation token not single-use (replayable stateless JWT)]] - concept - docs/qa/user-stories.md
- [[PersonaLens Charter Method (FedEx, Hostile, Antisocial, Saboteur, OCD, Couch-potato)]] - rationale - docs/qa/visual-qa-report.md
- [[QA Frontier Formula (staleness × risk − recentness)]] - rationale - docs/qa/coverage-map.md
- [[QA-Deferred Structural Items (Run 18)]] - concept - docs/PLANS.md
- [[Run 18 — Session-based deep QA of the post-2026-06-28 surface]] - concept - docs/qa/visual-qa-report.md
- [[Talim QA Coverage Map (frontier ledger)]] - document - docs/qa/coverage-map.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/QA_Deferred_Bug_Reports
SORT file.name ASC
```

## Connections to other communities
- 7 edges to [[_COMMUNITY_QA Traceability Ledger]]
- 3 edges to [[_COMMUNITY_Bug Tracking & Accounts]]
- 1 edge to [[_COMMUNITY_User Stories & QA Traceability]]
- 1 edge to [[_COMMUNITY_Product Plan Epics]]
- 1 edge to [[_COMMUNITY_Route Coverage Enumeration]]

## Top bridge nodes
- [[Talim QA Coverage Map (frontier ledger)]] - degree 14, connects to 3 communities
- [[Findings ledger]] - degree 11, connects to 3 communities
- [[Run 18 — Session-based deep QA of the post-2026-06-28 surface]] - degree 13, connects to 2 communities
- [[QA-Deferred Structural Items (Run 18)]] - degree 8, connects to 1 community
- [[O81 Impersonation token not single-use (replayable stateless JWT)]] - degree 5, connects to 1 community