---
type: community
cohesion: 0.18
members: 22
---

# Answer Grading Engine

**Cohesion:** 0.18 - loosely connected
**Members:** 22 nodes

## Members
- [[GradeResult]] - code - packages/types/grading.ts
- [[HotspotRegion]] - code - packages/types/grading.ts
- [[answerToString()]] - code - packages/types/grading.ts
- [[boundedEditDistance()]] - code - packages/types/grading.ts
- [[coerceStructuredAnswer()]] - code - packages/types/grading.ts
- [[evidenceWeightForQuestion()]] - code - packages/types/grading.ts
- [[fillBlankAcceptedPerBlank()]] - code - packages/types/grading.ts
- [[fuzzyForm()]] - code - packages/types/grading.ts
- [[gradeQuestion()]] - code - packages/types/grading.ts
- [[grading.ts]] - code - packages/types/grading.ts
- [[isCorrect()]] - code - packages/types/grading.ts
- [[isNumericMatch()]] - code - packages/types/grading.ts
- [[isWordTypo()]] - code - packages/types/grading.ts
- [[matchesAcceptedAnswer()]] - code - packages/types/grading.ts
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
TABLE source_file, type FROM #community/Answer_Grading_Engine
SORT file.name ASC
```

## Connections to other communities
- 11 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 10 edges to [[_COMMUNITY_Question Bank Service]]
- 8 edges to [[_COMMUNITY_Quiz Player UI]]
- 4 edges to [[_COMMUNITY_Question Post-processing]]
- 2 edges to [[_COMMUNITY_Assessment Service]]
- 2 edges to [[_COMMUNITY_Quiz Answer Helpers]]
- 1 edge to [[_COMMUNITY_Learning Progress & Coverage]]
- 1 edge to [[_COMMUNITY_Section Mastery (Elo-KT)]]
- 1 edge to [[_COMMUNITY_Shared Types & Zustand Stores]]

## Top bridge nodes
- [[grading.ts]] - degree 32, connects to 6 communities
- [[gradeQuestion()]] - degree 23, connects to 5 communities
- [[normalizeAnswer()]] - degree 14, connects to 4 communities
- [[answerToString()]] - degree 5, connects to 2 communities
- [[isCorrect()]] - degree 6, connects to 1 community