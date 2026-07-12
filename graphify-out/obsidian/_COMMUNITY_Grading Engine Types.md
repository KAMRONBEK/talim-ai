---
type: community
cohesion: 0.22
members: 17
---

# Grading Engine Types

**Cohesion:** 0.22 - loosely connected
**Members:** 17 nodes

## Members
- [[GradeResult]] - code - packages/types/grading.ts
- [[HotspotRegion]] - code - packages/types/grading.ts
- [[coerceStructuredAnswer()]] - code - packages/types/grading.ts
- [[evidenceWeightForQuestion()]] - code - packages/types/grading.ts
- [[fillBlankAcceptedPerBlank()]] - code - packages/types/grading.ts
- [[gradeQuestion()]] - code - packages/types/grading.ts
- [[grading.ts]] - code - packages/types/grading.ts
- [[isCorrect()]] - code - packages/types/grading.ts
- [[isNumericMatch()]] - code - packages/types/grading.ts
- [[normalizeAnswer()]] - code - packages/types/grading.ts
- [[orderingPairwiseCredit()]] - code - packages/types/grading.ts
- [[parseArrayAnswer()]] - code - packages/types/grading.ts
- [[parseHotspotPoint()]] - code - packages/types/grading.ts
- [[parseHotspotRegions()]] - code - packages/types/grading.ts
- [[parseMatchingChoices()]] - code - packages/types/grading.ts
- [[parseNumericAnswer()]] - code - packages/types/grading.ts
- [[pointInAnyRegion()]] - code - packages/types/grading.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Grading_Engine_Types
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_Question Banks & Builders]]
- 5 edges to [[_COMMUNITY_Quiz Player Inputs]]
- 4 edges to [[_COMMUNITY_Question Post-processing]]
- 4 edges to [[_COMMUNITY_Assessments Service]]
- 3 edges to [[_COMMUNITY_Quiz API Controller]]
- 2 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 2 edges to [[_COMMUNITY_Community 113]]
- 1 edge to [[_COMMUNITY_Quiz Player & Hooks]]
- 1 edge to [[_COMMUNITY_Section Mastery & Elo]]
- 1 edge to [[_COMMUNITY_Shared Types & Auth Stores]]
- 1 edge to [[_COMMUNITY_Assessment Pages & Wizard]]

## Top bridge nodes
- [[grading.ts]] - degree 26, connects to 7 communities
- [[gradeQuestion()]] - degree 22, connects to 6 communities
- [[normalizeAnswer()]] - degree 12, connects to 3 communities
- [[isCorrect()]] - degree 5, connects to 1 community
- [[parseHotspotRegions()]] - degree 4, connects to 1 community