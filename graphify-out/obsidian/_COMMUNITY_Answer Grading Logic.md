---
type: community
cohesion: 0.21
members: 20
---

# Answer Grading Logic

**Cohesion:** 0.21 - loosely connected
**Members:** 20 nodes

## Members
- [[HotspotRegion]] - code - packages/types/grading.ts
- [[answerToString()]] - code - packages/types/grading.ts
- [[boundedEditDistance()]] - code - packages/types/grading.ts
- [[coerceStructuredAnswer()]] - code - packages/types/grading.ts
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
TABLE source_file, type FROM #community/Answer_Grading_Logic
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_Bank & Question Management]]
- 9 edges to [[_COMMUNITY_Quiz Controller]]
- 6 edges to [[_COMMUNITY_Question Postprocessing]]
- 5 edges to [[_COMMUNITY_Quiz Answer Input Components]]
- 2 edges to [[_COMMUNITY_Assessment Service]]
- 2 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 2 edges to [[_COMMUNITY_Quiz Answer Utilities]]
- 1 edge to [[_COMMUNITY_Quiz Page & Hooks]]
- 1 edge to [[_COMMUNITY_Section Mastery Service]]
- 1 edge to [[_COMMUNITY_Question Editor Component]]
- 1 edge to [[_COMMUNITY_Admin Content & Subscriptions]]

## Top bridge nodes
- [[grading.ts]] - degree 32, connects to 8 communities
- [[gradeQuestion()]] - degree 23, connects to 6 communities
- [[normalizeAnswer()]] - degree 14, connects to 4 communities
- [[answerToString()]] - degree 5, connects to 2 communities
- [[isCorrect()]] - degree 6, connects to 1 community