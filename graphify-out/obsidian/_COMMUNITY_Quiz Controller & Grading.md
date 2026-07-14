---
type: community
cohesion: 0.09
members: 39
---

# Quiz Controller & Grading

**Cohesion:** 0.09 - loosely connected
**Members:** 39 nodes

## Members
- [[AiGradeEntry]] - code - apps/api/src/services/answerJudge.service.ts
- [[JudgeCandidate]] - code - apps/api/src/services/answerJudge.service.ts
- [[JudgeOptions]] - code - apps/api/src/services/answerJudge.service.ts
- [[JudgeVerdict]] - code - apps/api/src/services/answerJudge.service.ts
- [[QuizEvaluation]] - code - apps/api/src/controllers/quiz.controller.ts
- [[QuizQuestionForEvaluation]] - code - apps/api/src/controllers/quiz.controller.ts
- [[answerJudge.service.ts]] - code - apps/api/src/services/answerJudge.service.ts
- [[assertQuizAccess()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[bankQuestionKey()]] - code - apps/api/src/services/answerJudge.service.ts
- [[buildCoverageResults()]] - code - apps/api/src/services/learningProgress.service.ts
- [[checkAnswer()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[checkAnswerSchema]] - code - apps/api/src/controllers/quiz.controller.ts
- [[consumeJudgeBudget()]] - code - apps/api/src/services/answerJudge.service.ts
- [[createQuizSchema]] - code - apps/api/src/controllers/quiz.controller.ts
- [[evaluateQuizAnswers()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[formatAttempt()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[formatQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getContentMastery()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getLatestAttempt()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getSubmittedOptionLabel()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[isAiJudgedQuestionType()]] - code - packages/types/grading.ts
- [[isJudgeable()]] - code - apps/api/src/services/answerJudge.service.ts
- [[judgeBudgets]] - code - apps/api/src/services/answerJudge.service.ts
- [[judgeWithModel()]] - code - apps/api/src/services/answerJudge.service.ts
- [[judgeWrittenAnswers()]] - code - apps/api/src/services/answerJudge.service.ts
- [[listAttempts()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[listQuizzesByContent()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[normalizeForOptionMatch()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[practiceTypeEnum]] - code - apps/api/src/controllers/quiz.controller.ts
- [[quiz.controller.ts]] - code - apps/api/src/controllers/quiz.controller.ts
- [[quizCreatorUserId()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[quizQuestionKey()]] - code - apps/api/src/services/answerJudge.service.ts
- [[resolveAcceptedAnswers()]] - code - packages/types/grading.ts
- [[resolveSubmittedAnswer()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[stripSubmittedOptionLabel()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[submitQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[submitSchema]] - code - apps/api/src/controllers/quiz.controller.ts
- [[verdictHash()]] - code - apps/api/src/services/answerJudge.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Quiz_Controller__Grading
SORT file.name ASC
```

## Connections to other communities
- 13 edges to [[_COMMUNITY_Content Media Controllers]]
- 12 edges to [[_COMMUNITY_Assessment Service]]
- 11 edges to [[_COMMUNITY_Answer Grading Engine]]
- 8 edges to [[_COMMUNITY_Assessment Controller]]
- 8 edges to [[_COMMUNITY_Learning Progress & Coverage]]
- 5 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 5 edges to [[_COMMUNITY_Quiz Player UI]]
- 4 edges to [[_COMMUNITY_Section Mastery (Elo-KT)]]
- 3 edges to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 3 edges to [[_COMMUNITY_Question Bank Service]]
- 2 edges to [[_COMMUNITY_API Routes & Middleware]]
- 2 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 2 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 2 edges to [[_COMMUNITY_AI Provider Service]]
- 1 edge to [[_COMMUNITY_Admin Content & Audit Controllers]]
- 1 edge to [[_COMMUNITY_Quiz Generation Pipeline]]
- 1 edge to [[_COMMUNITY_Subscription & Billing Service]]

## Top bridge nodes
- [[quiz.controller.ts]] - degree 65, connects to 16 communities
- [[answerJudge.service.ts]] - degree 25, connects to 7 communities
- [[resolveAcceptedAnswers()]] - degree 9, connects to 4 communities
- [[submitQuiz()]] - degree 7, connects to 3 communities
- [[buildCoverageResults()]] - degree 6, connects to 3 communities