---
type: community
cohesion: 0.13
members: 22
---

# Quiz API

**Cohesion:** 0.13 - loosely connected
**Members:** 22 nodes

## Members
- [[GradeResult]] - code - packages/types/grading.ts
- [[QuizEvaluation]] - code - apps/api/src/controllers/quiz.controller.ts
- [[QuizQuestionForEvaluation]] - code - apps/api/src/controllers/quiz.controller.ts
- [[assertQuizAccess()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[checkAnswerSchema]] - code - apps/api/src/controllers/quiz.controller.ts
- [[createQuizSchema]] - code - apps/api/src/controllers/quiz.controller.ts
- [[evidenceWeightForQuestion()]] - code - packages/types/grading.ts
- [[formatAttempt()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[formatQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getContentMastery()_1]] - code - apps/api/src/services/sectionMastery.service.ts
- [[getLatestAttempt()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getSubmittedOptionLabel()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[listAttempts()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[normalizeForOptionMatch()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[practiceTypeEnum]] - code - apps/api/src/controllers/quiz.controller.ts
- [[quiz.controller.ts]] - code - apps/api/src/controllers/quiz.controller.ts
- [[quizCreatorUserId()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[resolveSubmittedAnswer()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[stripSubmittedOptionLabel()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[submitQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[submitSchema]] - code - apps/api/src/controllers/quiz.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Quiz_API
SORT file.name ASC
```

## Connections to other communities
- 18 edges to [[_COMMUNITY_Content Access & Media API]]
- 13 edges to [[_COMMUNITY_Grading Engine]]
- 5 edges to [[_COMMUNITY_Learner Submission & AI Judge]]
- 4 edges to [[_COMMUNITY_Assessment Services]]
- 4 edges to [[_COMMUNITY_Subscriptions & Quota]]
- 4 edges to [[_COMMUNITY_Elo-KT Section Mastery]]
- 3 edges to [[_COMMUNITY_Bull Jobs & Queues]]
- 3 edges to [[_COMMUNITY_Learning Progress Service]]
- 2 edges to [[_COMMUNITY_API Routing & Middleware]]
- 2 edges to [[_COMMUNITY_Quiz UI & Rich Text]]
- 1 edge to [[_COMMUNITY_Question Generation Pipeline]]
- 1 edge to [[_COMMUNITY_Shared Types & Locale]]

## Top bridge nodes
- [[quiz.controller.ts]] - degree 65, connects to 12 communities
- [[submitQuiz()]] - degree 7, connects to 4 communities
- [[assertQuizAccess()]] - degree 7, connects to 2 communities
- [[getLatestAttempt()]] - degree 5, connects to 2 communities
- [[formatQuiz()]] - degree 4, connects to 2 communities