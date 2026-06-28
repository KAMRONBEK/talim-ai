---
type: community
cohesion: 0.20
members: 10
---

# docs · Assignment, attempts & max attempts

**Cohesion:** 0.20 - loosely connected
**Members:** 10 nodes

## Members
- [[Assignment, attempts & max attempts]] - concept - docs/FEATURES.md
- [[Auto quizzes (per-content)]] - concept - docs/FEATURES.md
- [[Barrel-split module pattern]] - rationale - docs/FEATURES.md
- [[Class leaderboard]] - concept - docs/FEATURES.md
- [[GAME mode (per-question timer, speed points, streaks)]] - concept - docs/FEATURES.md
- [[Interactive Quiz Learn Player]] - concept - docs/plans/youlearn-redesign.md
- [[Per-question results & feedback]] - concept - docs/FEATURES.md
- [[Progress (per-student + class)]] - concept - docs/FEATURES.md
- [[Question banks (AI-generated, approve flow)]] - concept - docs/FEATURES.md
- [[Written assessments]] - concept - docs/FEATURES.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/docs__Assignment_attempts__max_attempts
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_docs · Background jobs (Bull  Redis)]]
- 1 edge to [[_COMMUNITY_plans · Internationalization (uz  en  ru)]]

## Top bridge nodes
- [[Auto quizzes (per-content)]] - degree 2, connects to 1 community
- [[Interactive Quiz Learn Player]] - degree 2, connects to 1 community