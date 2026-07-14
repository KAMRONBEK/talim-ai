---
type: community
cohesion: 0.24
members: 17
---

# Learning Progress Service

**Cohesion:** 0.24 - loosely connected
**Members:** 17 nodes

## Members
- [[CoverageQuestionResult]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[QuizWithQuestions]] - code - apps/api/src/services/learningProgress.service.ts
- [[blendCoverageScore()]] - code - apps/api/src/services/learningProgress.service.ts
- [[buildLearningCoverageUserPrompt()]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[computeBestFullQuizScore()]] - code - apps/api/src/services/learningProgress.service.ts
- [[estimateAiCoverage()]] - code - apps/api/src/services/learningProgress.service.ts
- [[isLatestSectionAttempt()]] - code - apps/api/src/services/learningProgress.service.ts
- [[isSectionComplete()]] - code - apps/api/src/services/learningProgress.service.ts
- [[learning-coverage-prompt.ts]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[learningProgress.service.ts]] - code - apps/api/src/services/learningProgress.service.ts
- [[markSectionViewed()]] - code - apps/api/src/services/learningProgress.service.ts
- [[persistSectionProgress()]] - code - apps/api/src/services/learningProgress.service.ts
- [[recalculateContentProgress()]] - code - apps/api/src/services/learningProgress.service.ts
- [[recordLearningActivity()]] - code - apps/api/src/services/learningProgress.service.ts
- [[refineSectionProgressWithAi()]] - code - apps/api/src/services/learningProgress.service.ts
- [[todayUtcDate()]] - code - apps/api/src/services/learningProgress.service.ts
- [[updateProgressAfterQuizSubmit()]] - code - apps/api/src/services/learningProgress.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Learning_Progress_Service
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_AI Summary & Ingest]]
- 6 edges to [[_COMMUNITY_Grading Engine]]
- 5 edges to [[_COMMUNITY_Tenant Progress & Mastery]]
- 3 edges to [[_COMMUNITY_Content Access & Media API]]
- 3 edges to [[_COMMUNITY_Quiz API]]
- 2 edges to [[_COMMUNITY_Bull Jobs & Queues]]
- 2 edges to [[_COMMUNITY_Subscriptions & Quota]]
- 2 edges to [[_COMMUNITY_Learner Submission & AI Judge]]
- 1 edge to [[_COMMUNITY_Shared Types & Locale]]

## Top bridge nodes
- [[learningProgress.service.ts]] - degree 39, connects to 9 communities
- [[refineSectionProgressWithAi()]] - degree 7, connects to 2 communities
- [[recordLearningActivity()]] - degree 8, connects to 1 community
- [[updateProgressAfterQuizSubmit()]] - degree 6, connects to 1 community
- [[markSectionViewed()]] - degree 5, connects to 1 community