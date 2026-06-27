---
type: community
cohesion: 0.11
members: 35
---

# Quiz Controller

**Cohesion:** 0.11 - loosely connected
**Members:** 35 nodes

## Members
- [[CoverageQuestionResult]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[QuizQuestionForEvaluation]] - code - apps/api/src/controllers/quiz.controller.ts
- [[QuizWithQuestions]] - code - apps/api/src/services/learningProgress.service.ts
- [[assertQuizAccess()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[blendCoverageScore()]] - code - apps/api/src/services/learningProgress.service.ts
- [[buildCoverageResults()]] - code - apps/api/src/services/learningProgress.service.ts
- [[buildLearningCoverageUserPrompt()]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[computeBestFullQuizScore()]] - code - apps/api/src/services/learningProgress.service.ts
- [[computeQuickCheckAccuracy()]] - code - apps/api/src/services/learningProgress.service.ts
- [[createQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[createQuizSchema]] - code - apps/api/src/controllers/quiz.controller.ts
- [[estimateAiCoverage()]] - code - apps/api/src/services/learningProgress.service.ts
- [[evaluateQuizAnswers()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[formatAttempt()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[formatQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getLatestAttempt()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getSubmittedOptionLabel()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[isLatestSectionAttempt()]] - code - apps/api/src/services/learningProgress.service.ts
- [[isOpenAnswerCorrect()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[isSectionComplete()]] - code - apps/api/src/services/learningProgress.service.ts
- [[learning-coverage-prompt.ts]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[learningProgress.service.ts]] - code - apps/api/src/services/learningProgress.service.ts
- [[listAttempts()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[normalizeAnswer()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[persistSectionProgress()]] - code - apps/api/src/services/learningProgress.service.ts
- [[quiz.controller.ts]] - code - apps/api/src/controllers/quiz.controller.ts
- [[quizCreatorUserId()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[recalculateContentProgress()]] - code - apps/api/src/services/learningProgress.service.ts
- [[refineSectionProgressWithAi()]] - code - apps/api/src/services/learningProgress.service.ts
- [[resolveSubmittedAnswer()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[stripSubmittedOptionLabel()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[submitQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[submitSchema]] - code - apps/api/src/controllers/quiz.controller.ts
- [[updateProgressAfterQuizSubmit()]] - code - apps/api/src/services/learningProgress.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Quiz_Controller
SORT file.name ASC
```

## Connections to other communities
- 19 edges to [[_COMMUNITY_Content & Podcast API]]
- 9 edges to [[_COMMUNITY_Tenant Admin & Prisma]]
- 6 edges to [[_COMMUNITY_Community 97]]
- 6 edges to [[_COMMUNITY_Section & Summary API]]
- 5 edges to [[_COMMUNITY_Community 51]]
- 5 edges to [[_COMMUNITY_Billing & Usage API]]
- 2 edges to [[_COMMUNITY_Admin Audit & Auth]]
- 2 edges to [[_COMMUNITY_Slide Deck Types]]
- 2 edges to [[_COMMUNITY_Community 57]]
- 1 edge to [[_COMMUNITY_Admin Analytics & Subscriptions]]
- 1 edge to [[_COMMUNITY_Content Controller]]
- 1 edge to [[_COMMUNITY_Env Config & Jobs]]
- 1 edge to [[_COMMUNITY_Community 67]]

## Top bridge nodes
- [[quiz.controller.ts]] - degree 45, connects to 11 communities
- [[learningProgress.service.ts]] - degree 33, connects to 7 communities
- [[createQuiz()]] - degree 8, connects to 2 communities
- [[evaluateQuizAnswers()]] - degree 8, connects to 2 communities
- [[persistSectionProgress()]] - degree 8, connects to 1 community