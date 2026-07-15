---
type: community
cohesion: 0.50
members: 4
---

# Leaderboard Table Component

**Cohesion:** 0.50 - moderately connected
**Members:** 4 nodes

## Members
- [[AssessmentLeaderboardRow]] - code - packages/types/index.ts
- [[AssessmentMode]] - code - packages/types/index.ts
- [[LeaderboardTable()]] - code - apps/web/components/learner/leaderboard-table.tsx
- [[leaderboard-table.tsx]] - code - apps/web/components/learner/leaderboard-table.tsx

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Leaderboard_Table_Component
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 2 edges to [[_COMMUNITY_Game Quiz Player]]
- 2 edges to [[_COMMUNITY_Tenant Assessments Page]]
- 1 edge to [[_COMMUNITY_Learner Dashboard]]
- 1 edge to [[_COMMUNITY_Assessment Leaderboard]]

## Top bridge nodes
- [[leaderboard-table.tsx]] - degree 6, connects to 3 communities
- [[LeaderboardTable()]] - degree 4, connects to 3 communities
- [[AssessmentMode]] - degree 3, connects to 2 communities
- [[AssessmentLeaderboardRow]] - degree 2, connects to 1 community