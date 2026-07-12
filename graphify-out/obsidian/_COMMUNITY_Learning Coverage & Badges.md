---
type: community
cohesion: 0.10
members: 42
---

# Learning Coverage & Badges

**Cohesion:** 0.10 - loosely connected
**Members:** 42 nodes

## Members
- [[Badge]] - code - packages/types/index.ts
- [[CoverageQuestionResult]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[LearnerMastery]] - code - apps/api/src/services/mastery.service.ts
- [[LearnerProgress]] - code - packages/types/index.ts
- [[MasteryTopic]] - code - packages/types/index.ts
- [[QuizWithQuestions]] - code - apps/api/src/services/learningProgress.service.ts
- [[badges.service.ts]] - code - apps/api/src/services/badges.service.ts
- [[blendCoverageScore()]] - code - apps/api/src/services/learningProgress.service.ts
- [[buildContentListWhere()]] - code - apps/api/src/services/contentAccess.service.ts
- [[buildCoverageResults()]] - code - apps/api/src/services/learningProgress.service.ts
- [[buildLearningCoverageUserPrompt()]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[clamp01()]] - code - apps/api/src/services/badges.service.ts
- [[computeBadges()]] - code - apps/api/src/services/badges.service.ts
- [[computeBestFullQuizScore()]] - code - apps/api/src/services/learningProgress.service.ts
- [[computeStreakDays()]] - code - apps/api/src/services/learningProgress.service.ts
- [[estimateAiCoverage()]] - code - apps/api/src/services/learningProgress.service.ts
- [[finalize()]] - code - apps/api/src/services/badges.service.ts
- [[getAssignedContentIds()]] - code - apps/api/src/services/contentAccess.service.ts
- [[getClassMastery()]] - code - apps/api/src/services/mastery.service.ts
- [[getLearnerMastery()]] - code - apps/api/src/services/mastery.service.ts
- [[getLearnerMaterials()]] - code - apps/api/src/services/tenant/progress.ts
- [[getLearnerProgress()]] - code - apps/api/src/services/tenant/progress.ts
- [[getLearnerSummary()]] - code - apps/api/src/services/tenant/progress.ts
- [[getStudentProgress()_1]] - code - apps/api/src/services/tenant/progress.ts
- [[getTenantProgress()]] - code - apps/api/src/services/tenant/progress.ts
- [[isLatestSectionAttempt()]] - code - apps/api/src/services/learningProgress.service.ts
- [[isSectionComplete()]] - code - apps/api/src/services/learningProgress.service.ts
- [[learning-coverage-prompt.ts]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[learningProgress.service.ts]] - code - apps/api/src/services/learningProgress.service.ts
- [[listContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[listStudents()_1]] - code - apps/api/src/services/tenant/students.ts
- [[markSectionViewed()]] - code - apps/api/src/services/learningProgress.service.ts
- [[mastery.service.ts]] - code - apps/api/src/services/mastery.service.ts
- [[persistSectionProgress()]] - code - apps/api/src/services/learningProgress.service.ts
- [[progress.ts]] - code - apps/api/src/services/tenant/progress.ts
- [[recalculateContentProgress()]] - code - apps/api/src/services/learningProgress.service.ts
- [[recordLearningActivity()]] - code - apps/api/src/services/learningProgress.service.ts
- [[refineSectionProgressWithAi()]] - code - apps/api/src/services/learningProgress.service.ts
- [[resolveSectionTitles()]] - code - apps/api/src/services/mastery.service.ts
- [[roundPct()]] - code - apps/api/src/services/mastery.service.ts
- [[todayUtcDate()]] - code - apps/api/src/services/learningProgress.service.ts
- [[updateProgressAfterQuizSubmit()]] - code - apps/api/src/services/learningProgress.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Learning_Coverage__Badges
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_Admin Tenants API]]
- 8 edges to [[_COMMUNITY_Flashcards API]]
- 7 edges to [[_COMMUNITY_Assessment API Controllers]]
- 7 edges to [[_COMMUNITY_Shared Types]]
- 4 edges to [[_COMMUNITY_Admin & Events Controllers]]
- 4 edges to [[_COMMUNITY_Community 45]]
- 3 edges to [[_COMMUNITY_Community 56]]
- 3 edges to [[_COMMUNITY_Podcast API]]
- 3 edges to [[_COMMUNITY_Community 46]]
- 2 edges to [[_COMMUNITY_Community 83]]
- 2 edges to [[_COMMUNITY_Content Hooks & Locale]]
- 2 edges to [[_COMMUNITY_Community 75]]
- 1 edge to [[_COMMUNITY_Community 52]]
- 1 edge to [[_COMMUNITY_Community 115]]
- 1 edge to [[_COMMUNITY_Community 67]]
- 1 edge to [[_COMMUNITY_Community 58]]
- 1 edge to [[_COMMUNITY_Tenant Dashboard & Shell]]

## Top bridge nodes
- [[learningProgress.service.ts]] - degree 35, connects to 9 communities
- [[progress.ts]] - degree 25, connects to 8 communities
- [[mastery.service.ts]] - degree 17, connects to 7 communities
- [[badges.service.ts]] - degree 10, connects to 2 communities
- [[buildContentListWhere()]] - degree 4, connects to 2 communities