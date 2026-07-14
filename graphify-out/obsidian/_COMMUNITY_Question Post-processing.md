---
type: community
cohesion: 0.19
members: 19
---

# Question Post-processing

**Cohesion:** 0.19 - loosely connected
**Members:** 19 nodes

## Members
- [[BANNED_OPTION_PATTERNS]] - code - apps/api/src/lib/question-postprocess.ts
- [[GeneratedQuestion]] - code - apps/api/src/services/assessment/shared.ts
- [[PostprocessInput]] - code - apps/api/src/lib/question-postprocess.ts
- [[PostprocessResult]] - code - apps/api/src/lib/question-postprocess.ts
- [[canonicalizeMathDelimiters()]] - code - apps/api/src/lib/question-postprocess.ts
- [[canonicalizeNullable()]] - code - apps/api/src/lib/question-postprocess.ts
- [[containmentNormalize()_1]] - code - apps/api/src/lib/question-postprocess.ts
- [[dropParrotingQuestions()]] - code - apps/api/src/lib/question-quality.ts
- [[hasBannedOption()]] - code - apps/api/src/lib/question-postprocess.ts
- [[isParroting()]] - code - apps/api/src/lib/question-quality.ts
- [[normalizeText()]] - code - apps/api/src/lib/question-quality.ts
- [[postprocessGeneratedQuestions()]] - code - apps/api/src/lib/question-postprocess.ts
- [[question-postprocess.ts]] - code - apps/api/src/lib/question-postprocess.ts
- [[question-quality.ts]] - code - apps/api/src/lib/question-quality.ts
- [[sanitizeBloom()]] - code - apps/api/src/lib/question-postprocess.ts
- [[sanitizeDifficulty()]] - code - apps/api/src/lib/question-postprocess.ts
- [[sanitizeRationales()]] - code - apps/api/src/lib/question-postprocess.ts
- [[shuffleOptionsWithKey()]] - code - apps/api/src/lib/question-postprocess.ts
- [[verifySourceQuote()]] - code - apps/api/src/lib/question-postprocess.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Question_Post-processing
SORT file.name ASC
```

## Connections to other communities
- 13 edges to [[_COMMUNITY_Question Bank Service]]
- 7 edges to [[_COMMUNITY_Quiz Generation Pipeline]]
- 4 edges to [[_COMMUNITY_Answer Grading Engine]]
- 2 edges to [[_COMMUNITY_Assessment Service]]
- 2 edges to [[_COMMUNITY_Quiz Player UI]]
- 1 edge to [[_COMMUNITY_Shared Types & Zustand Stores]]

## Top bridge nodes
- [[question-postprocess.ts]] - degree 30, connects to 6 communities
- [[postprocessGeneratedQuestions()]] - degree 19, connects to 4 communities
- [[GeneratedQuestion]] - degree 5, connects to 3 communities
- [[shuffleOptionsWithKey()]] - degree 4, connects to 2 communities
- [[hasBannedOption()]] - degree 3, connects to 1 community