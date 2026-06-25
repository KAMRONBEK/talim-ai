---
type: community
cohesion: 0.17
members: 20
---

# Quiz Controller & Grading

**Cohesion:** 0.17 - loosely connected
**Members:** 20 nodes

## Members
- [[QuizQuestionForEvaluation]] - code - apps/api/src/controllers/quiz.controller.ts
- [[assertQuizAccess()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[createQuizSchema]] - code - apps/api/src/controllers/quiz.controller.ts
- [[evaluateQuizAnswers()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[formatAttempt()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[formatQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getLatestAttempt()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getSubmittedOptionLabel()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[isOpenAnswerCorrect()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[listAttempts()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[listQuizzesByContent()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[normalizeAnswer()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[questionStyleEnum]] - code - apps/api/src/services/assessment/shared.ts
- [[quiz.controller.ts]] - code - apps/api/src/controllers/quiz.controller.ts
- [[quizCreatorUserId()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[resolveSubmittedAnswer()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[stripSubmittedOptionLabel()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[submitQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[submitSchema]] - code - apps/api/src/controllers/quiz.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Quiz_Controller__Grading
SORT file.name ASC
```

## Connections to other communities
- 11 edges to [[_COMMUNITY_Podcast & Progress Controllers]]
- 7 edges to [[_COMMUNITY_Tutor-Request & Assessment Controllers]]
- 4 edges to [[_COMMUNITY_Rich Text & Quiz Card UI]]
- 3 edges to [[_COMMUNITY_Learner Assessment Service]]
- 3 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 3 edges to [[_COMMUNITY_Learning Progress & Coverage Scoring]]
- 2 edges to [[_COMMUNITY_Assessment Service]]
- 2 edges to [[_COMMUNITY_AI Summary Generation]]
- 2 edges to [[_COMMUNITY_API Middleware (authquotarate-limit)]]
- 2 edges to [[_COMMUNITY_Env Config & Background Job Registration]]
- 1 edge to [[_COMMUNITY_Content Controller (B2C)]]
- 1 edge to [[_COMMUNITY_Subscription Service]]
- 1 edge to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]

## Top bridge nodes
- [[quiz.controller.ts]] - degree 45, connects to 13 communities
- [[evaluateQuizAnswers()]] - degree 8, connects to 2 communities
- [[submitQuiz()]] - degree 6, connects to 2 communities
- [[formatQuiz()]] - degree 4, connects to 2 communities
- [[listQuizzesByContent()]] - degree 4, connects to 2 communities