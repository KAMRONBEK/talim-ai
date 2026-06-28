---
type: community
cohesion: 0.12
members: 32
---

# src services · learning-coverage-prompt.ts

**Cohesion:** 0.12 - loosely connected
**Members:** 32 nodes

## Members
- [[CoverageQuestionResult]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[OPTION_LABELS]] - code - packages/types/quiz-answer.ts
- [[QuizWithQuestions]] - code - apps/api/src/services/learningProgress.service.ts
- [[blendCoverageScore()]] - code - apps/api/src/services/learningProgress.service.ts
- [[buildCoverageResults()]] - code - apps/api/src/services/learningProgress.service.ts
- [[buildLearningCoverageUserPrompt()]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[computeBestFullQuizScore()]] - code - apps/api/src/services/learningProgress.service.ts
- [[computeQuickCheckAccuracy()]] - code - apps/api/src/services/learningProgress.service.ts
- [[computeStreakDays()]] - code - apps/api/src/services/learningProgress.service.ts
- [[estimateAiCoverage()]] - code - apps/api/src/services/learningProgress.service.ts
- [[getLearnerSummary()]] - code - apps/api/src/services/tenant/progress.ts
- [[getOptionLabel()]] - code - packages/types/quiz-answer.ts
- [[getStudentProgress()_1]] - code - apps/api/src/services/tenant/progress.ts
- [[getTenantProgress()]] - code - apps/api/src/services/tenant/progress.ts
- [[isLatestSectionAttempt()]] - code - apps/api/src/services/learningProgress.service.ts
- [[isSectionComplete()]] - code - apps/api/src/services/learningProgress.service.ts
- [[isSelectedAnswerCorrect()]] - code - packages/types/quiz-answer.ts
- [[learning-coverage-prompt.ts]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[learningProgress.service.ts]] - code - apps/api/src/services/learningProgress.service.ts
- [[listStudents()_1]] - code - apps/api/src/services/tenant/students.ts
- [[markSectionViewed()]] - code - apps/api/src/services/learningProgress.service.ts
- [[normalize()_1]] - code - packages/types/quiz-answer.ts
- [[persistSectionProgress()]] - code - apps/api/src/services/learningProgress.service.ts
- [[progress.ts]] - code - apps/api/src/services/tenant/progress.ts
- [[quiz-answer.ts]] - code - packages/types/quiz-answer.ts
- [[recalculateContentProgress()]] - code - apps/api/src/services/learningProgress.service.ts
- [[recordLearningActivity()]] - code - apps/api/src/services/learningProgress.service.ts
- [[refineSectionProgressWithAi()]] - code - apps/api/src/services/learningProgress.service.ts
- [[resolveCorrectAnswer()]] - code - packages/types/quiz-answer.ts
- [[stripOptionLabel()]] - code - packages/types/quiz-answer.ts
- [[todayUtcDate()]] - code - apps/api/src/services/learningProgress.service.ts
- [[updateProgressAfterQuizSubmit()]] - code - apps/api/src/services/learningProgress.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/src_services__learning-coverage-promptts
SORT file.name ASC
```

## Connections to other communities
- 7 edges to [[_COMMUNITY_src controllers]]
- 7 edges to [[_COMMUNITY_src controllers · quiz.controller.ts]]
- 4 edges to [[_COMMUNITY_subscription]]
- 4 edges to [[_COMMUNITY_controllers admin]]
- 4 edges to [[_COMMUNITY_packages types]]
- 3 edges to [[_COMMUNITY_src controllers · summary.controller.ts]]
- 3 edges to [[_COMMUNITY_services tenant]]
- 3 edges to [[_COMMUNITY_web hooks · page.tsx]]
- 2 edges to [[_COMMUNITY_src services · TutorGraphIntent]]
- 1 edge to [[_COMMUNITY_src services]]

## Top bridge nodes
- [[learningProgress.service.ts]] - degree 33, connects to 8 communities
- [[progress.ts]] - degree 12, connects to 3 communities
- [[isSelectedAnswerCorrect()]] - degree 11, connects to 3 communities
- [[resolveCorrectAnswer()]] - degree 7, connects to 3 communities
- [[computeStreakDays()]] - degree 7, connects to 1 community