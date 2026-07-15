---
type: community
cohesion: 0.50
members: 4
---

# Bug Tracking & Accounts

**Cohesion:** 0.50 - moderately connected
**Members:** 4 nodes

## Members
- [[F11 Stale session token after admin role change]] - concept - docs/qa/visual-qa-report.md
- [[F45 Stale JWT after role change (tutor approval)]] - concept - docs/qa/user-stories.md
- [[Overnight Visual QA Report (session journal, Runs 1–18)]] - document - docs/qa/visual-qa-report.md
- [[QA Test Accounts (qa-admin, qa-owner, teststudent12, qa-individual)]] - concept - docs/qa/visual-qa-report.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Bug_Tracking__Accounts
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_QA Deferred Bug Reports]]
- 1 edge to [[_COMMUNITY_QA Traceability Ledger]]

## Top bridge nodes
- [[Overnight Visual QA Report (session journal, Runs 1–18)]] - degree 5, connects to 2 communities
- [[F45 Stale JWT after role change (tutor approval)]] - degree 2, connects to 1 community