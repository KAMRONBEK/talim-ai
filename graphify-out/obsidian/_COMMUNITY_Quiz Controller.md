---
type: community
cohesion: 0.08
members: 39
---

# Quiz Controller

**Cohesion:** 0.08 - loosely connected
**Members:** 39 nodes

## Members
- [[AiGradeEntry]] - code - apps/api/src/services/answerJudge.service.ts
- [[GradeResult]] - code - packages/types/grading.ts
- [[JudgeCandidate]] - code - apps/api/src/services/answerJudge.service.ts
- [[JudgeOptions]] - code - apps/api/src/services/answerJudge.service.ts
- [[JudgeVerdict]] - code - apps/api/src/services/answerJudge.service.ts
- [[QuizEvaluation]] - code - apps/api/src/controllers/quiz.controller.ts
- [[QuizQuestionForEvaluation]] - code - apps/api/src/controllers/quiz.controller.ts
- [[answerJudge.service.ts]] - code - apps/api/src/services/answerJudge.service.ts
- [[assertQuizAccess()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[bankQuestionKey()]] - code - apps/api/src/services/answerJudge.service.ts
- [[checkAnswer()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[checkAnswerSchema]] - code - apps/api/src/controllers/quiz.controller.ts
- [[consumeJudgeBudget()]] - code - apps/api/src/services/answerJudge.service.ts
- [[createQuizSchema]] - code - apps/api/src/controllers/quiz.controller.ts
- [[evaluateQuizAnswers()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[evidenceWeightForQuestion()]] - code - packages/types/grading.ts
- [[formatAttempt()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[formatQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getLatestAttempt()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getSubmittedOptionLabel()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[isJudgeable()]] - code - apps/api/src/services/answerJudge.service.ts
- [[judgeBudgets]] - code - apps/api/src/services/answerJudge.service.ts
- [[judgeWithModel()]] - code - apps/api/src/services/answerJudge.service.ts
- [[judgeWrittenAnswers()]] - code - apps/api/src/services/answerJudge.service.ts
- [[listAttempts()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[normalizeForOptionMatch()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[practiceTypeEnum]] - code - apps/api/src/controllers/quiz.controller.ts
- [[questionDepthEnum]] - code - apps/api/src/services/assessment/shared.ts
- [[questionStyleEnum]] - code - apps/api/src/services/assessment/shared.ts
- [[quiz.controller.ts]] - code - apps/api/src/controllers/quiz.controller.ts
- [[quizCreatorUserId()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[resolveAcceptedAnswers()]] - code - packages/types/grading.ts
- [[resolveSubmittedAnswer()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[stripSubmittedOptionLabel()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[submitAnswerValueSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[submitQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[submitSchema]] - code - apps/api/src/controllers/quiz.controller.ts
- [[verdictHash()]] - code - apps/api/src/services/answerJudge.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Quiz_Controller
SORT file.name ASC
```

## Connections to other communities
- 11 edges to [[_COMMUNITY_Assessment Service]]
- 10 edges to [[_COMMUNITY_Flashcards & Podcast Controllers]]
- 10 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 9 edges to [[_COMMUNITY_Answer Grading Logic]]
- 8 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 8 edges to [[_COMMUNITY_Content Controller (YouTubeOCR)]]
- 5 edges to [[_COMMUNITY_Quiz Answer Input Components]]
- 4 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 4 edges to [[_COMMUNITY_Section Mastery Service]]
- 3 edges to [[_COMMUNITY_Bank & Question Management]]
- 2 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 2 edges to [[_COMMUNITY_AI Service (DeepSeek)]]
- 1 edge to [[_COMMUNITY_Audit & Content Management]]
- 1 edge to [[_COMMUNITY_Quiz Generation Job]]
- 1 edge to [[_COMMUNITY_Quiz Page & Hooks]]
- 1 edge to [[_COMMUNITY_Assessment Controller]]

## Top bridge nodes
- [[quiz.controller.ts]] - degree 65, connects to 15 communities
- [[answerJudge.service.ts]] - degree 25, connects to 7 communities
- [[resolveAcceptedAnswers()]] - degree 9, connects to 4 communities
- [[checkAnswer()]] - degree 8, connects to 4 communities
- [[evaluateQuizAnswers()]] - degree 8, connects to 3 communities