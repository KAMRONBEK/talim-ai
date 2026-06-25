---
type: community
cohesion: 0.15
members: 25
---

# Learning Progress & Coverage Scoring

**Cohesion:** 0.15 - loosely connected
**Members:** 25 nodes

## Members
- [[CoverageQuestionResult]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[QuizWithQuestions]] - code - apps/api/src/services/learningProgress.service.ts
- [[blendCoverageScore()]] - code - apps/api/src/services/learningProgress.service.ts
- [[buildCoverageResults()]] - code - apps/api/src/services/learningProgress.service.ts
- [[buildLearningCoverageUserPrompt()]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[computeBestFullQuizScore()]] - code - apps/api/src/services/learningProgress.service.ts
- [[computeQuickCheckAccuracy()]] - code - apps/api/src/services/learningProgress.service.ts
- [[computeStreakDays()]] - code - apps/api/src/services/learningProgress.service.ts
- [[estimateAiCoverage()]] - code - apps/api/src/services/learningProgress.service.ts
- [[getLearnerSummary()]] - code - apps/api/src/services/tenant/progress.ts
- [[getStudentProgress()_1]] - code - apps/api/src/services/tenant/progress.ts
- [[getTenantProgress()]] - code - apps/api/src/services/tenant/progress.ts
- [[isLatestSectionAttempt()]] - code - apps/api/src/services/learningProgress.service.ts
- [[isSectionComplete()]] - code - apps/api/src/services/learningProgress.service.ts
- [[learning-coverage-prompt.ts]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[learningProgress.service.ts]] - code - apps/api/src/services/learningProgress.service.ts
- [[listStudents()_1]] - code - apps/api/src/services/tenant/students.ts
- [[markSectionViewed()]] - code - apps/api/src/services/learningProgress.service.ts
- [[persistSectionProgress()]] - code - apps/api/src/services/learningProgress.service.ts
- [[progress.ts]] - code - apps/api/src/services/tenant/progress.ts
- [[recalculateContentProgress()]] - code - apps/api/src/services/learningProgress.service.ts
- [[recordLearningActivity()]] - code - apps/api/src/services/learningProgress.service.ts
- [[refineSectionProgressWithAi()]] - code - apps/api/src/services/learningProgress.service.ts
- [[todayUtcDate()]] - code - apps/api/src/services/learningProgress.service.ts
- [[updateProgressAfterQuizSubmit()]] - code - apps/api/src/services/learningProgress.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Learning_Progress__Coverage_Scoring
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_AI Summary Generation]]
- 6 edges to [[_COMMUNITY_Podcast & Progress Controllers]]
- 4 edges to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 3 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 3 edges to [[_COMMUNITY_Tenant Service & Content Assignment]]
- 2 edges to [[_COMMUNITY_AI Service (DeepSeektools)]]
- 2 edges to [[_COMMUNITY_Rich Text & Quiz Card UI]]
- 1 edge to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]

## Top bridge nodes
- [[learningProgress.service.ts]] - degree 33, connects to 7 communities
- [[progress.ts]] - degree 12, connects to 3 communities
- [[recordLearningActivity()]] - degree 6, connects to 2 communities
- [[computeStreakDays()]] - degree 7, connects to 1 community
- [[refineSectionProgressWithAi()]] - degree 7, connects to 1 community