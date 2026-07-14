---
type: community
cohesion: 0.17
members: 22
---

# Question Postprocessing

**Cohesion:** 0.17 - loosely connected
**Members:** 22 nodes

## Members
- [[BANNED_OPTION_PATTERNS]] - code - apps/api/src/lib/question-postprocess.ts
- [[GeneratedQuestion]] - code - apps/api/src/services/assessment/shared.ts
- [[PostprocessInput]] - code - apps/api/src/lib/question-postprocess.ts
- [[PostprocessResult]] - code - apps/api/src/lib/question-postprocess.ts
- [[buildOrderingQuestion()]] - code - apps/api/src/lib/question-builders.ts
- [[buildStructuredQuestion()]] - code - apps/api/src/lib/question-builders.ts
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
- [[shuffled()]] - code - apps/api/src/lib/question-builders.ts
- [[verifySourceQuote()]] - code - apps/api/src/lib/question-postprocess.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Question_Postprocessing
SORT file.name ASC
```

## Connections to other communities
- 11 edges to [[_COMMUNITY_Question Bank Builders]]
- 11 edges to [[_COMMUNITY_Grading Engine]]
- 7 edges to [[_COMMUNITY_Question Generation Pipeline]]
- 2 edges to [[_COMMUNITY_Assessment Services]]
- 1 edge to [[_COMMUNITY_Shared Types & Locale]]

## Top bridge nodes
- [[question-postprocess.ts]] - degree 30, connects to 5 communities
- [[postprocessGeneratedQuestions()]] - degree 19, connects to 3 communities
- [[GeneratedQuestion]] - degree 5, connects to 3 communities
- [[buildStructuredQuestion()]] - degree 8, connects to 2 communities
- [[shuffled()]] - degree 6, connects to 2 communities