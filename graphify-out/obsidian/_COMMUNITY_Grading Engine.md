---
type: community
cohesion: 0.15
members: 30
---

# Grading Engine

**Cohesion:** 0.15 - loosely connected
**Members:** 30 nodes

## Members
- [[HotspotRegion]] - code - packages/types/grading.ts
- [[answerToString()]] - code - packages/types/grading.ts
- [[boundedEditDistance()]] - code - packages/types/grading.ts
- [[buildCoverageResults()]] - code - apps/api/src/services/learningProgress.service.ts
- [[buildDropdownClozeQuestion()]] - code - apps/api/src/lib/question-builders.ts
- [[buildMatchingQuestion()]] - code - apps/api/src/lib/question-builders.ts
- [[checkAnswer()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[coerceStructuredAnswer()]] - code - packages/types/grading.ts
- [[createBankQuestion()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[evaluateQuizAnswers()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[fillBlankAcceptedPerBlank()]] - code - packages/types/grading.ts
- [[formatQuestion()]] - code - apps/api/src/services/assessment/shared.ts
- [[fuzzyForm()]] - code - packages/types/grading.ts
- [[gradeQuestion()]] - code - packages/types/grading.ts
- [[grading.ts]] - code - packages/types/grading.ts
- [[isCorrect()]] - code - packages/types/grading.ts
- [[isNumericMatch()]] - code - packages/types/grading.ts
- [[isWordTypo()]] - code - packages/types/grading.ts
- [[jsonStringArray()]] - code - packages/types/grading.ts
- [[matchesAcceptedAnswer()]] - code - packages/types/grading.ts
- [[normalizeAnswer()]] - code - packages/types/grading.ts
- [[orderingPairwiseCredit()]] - code - packages/types/grading.ts
- [[parseArrayAnswer()]] - code - packages/types/grading.ts
- [[parseHotspotPoint()]] - code - packages/types/grading.ts
- [[parseMatchingChoices()]] - code - packages/types/grading.ts
- [[parseNumericAnswer()]] - code - packages/types/grading.ts
- [[parseQuestionConfig()]] - code - packages/types/grading.ts
- [[pointInAnyRegion()]] - code - packages/types/grading.ts
- [[quizQuestionKey()]] - code - apps/api/src/services/answerJudge.service.ts
- [[resolveAcceptedAnswers()]] - code - packages/types/grading.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Grading_Engine
SORT file.name ASC
```

## Connections to other communities
- 19 edges to [[_COMMUNITY_Question Bank Builders]]
- 17 edges to [[_COMMUNITY_Quiz UI & Rich Text]]
- 13 edges to [[_COMMUNITY_Quiz API]]
- 11 edges to [[_COMMUNITY_Question Postprocessing]]
- 9 edges to [[_COMMUNITY_Learner Submission & AI Judge]]
- 6 edges to [[_COMMUNITY_Learning Progress Service]]
- 3 edges to [[_COMMUNITY_Assessment Services]]
- 2 edges to [[_COMMUNITY_Elo-KT Section Mastery]]
- 2 edges to [[_COMMUNITY_Quiz Answer Helpers]]
- 1 edge to [[_COMMUNITY_Content Access & Media API]]
- 1 edge to [[_COMMUNITY_Shared Types & Locale]]
- 1 edge to [[_COMMUNITY_Practice & Content Dialogs]]

## Top bridge nodes
- [[jsonStringArray()]] - degree 22, connects to 8 communities
- [[grading.ts]] - degree 32, connects to 7 communities
- [[gradeQuestion()]] - degree 23, connects to 5 communities
- [[parseQuestionConfig()]] - degree 18, connects to 5 communities
- [[normalizeAnswer()]] - degree 14, connects to 4 communities