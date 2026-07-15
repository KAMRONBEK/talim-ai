---
type: community
cohesion: 0.10
members: 41
---

# Learning Coverage & Badges

**Cohesion:** 0.10 - loosely connected
**Members:** 41 nodes

## Members
- [[Badge]] - code - packages/types/index.ts
- [[CoverageQuestionResult]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[LearnerMastery]] - code - apps/api/src/services/mastery.service.ts
- [[LearnerMaterial]] - code - packages/types/index.ts
- [[LearnerProgress]] - code - packages/types/index.ts
- [[MasteryTopic]] - code - packages/types/index.ts
- [[QuizWithQuestions]] - code - apps/api/src/services/learningProgress.service.ts
- [[badges.service.ts]] - code - apps/api/src/services/badges.service.ts
- [[blendCoverageScore()]] - code - apps/api/src/services/learningProgress.service.ts
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
- [[learning-coverage-prompt.ts]] - code - apps/api/src/lib/learning-coverage-prompt.ts
- [[learningProgress.service.ts]] - code - apps/api/src/services/learningProgress.service.ts
- [[listStudents()_1]] - code - apps/api/src/services/tenant/students.ts
- [[markSectionViewed()]] - code - apps/api/src/services/learningProgress.service.ts
- [[mastery.service.ts]] - code - apps/api/src/services/mastery.service.ts
- [[persistSectionProgress()]] - code - apps/api/src/services/learningProgress.service.ts
- [[progress.ts]] - code - apps/api/src/services/tenant/progress.ts
- [[quizQuestionKey()]] - code - apps/api/src/services/answerJudge.service.ts
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
- 10 edges to [[_COMMUNITY_Quiz Controller]]
- 8 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 8 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 5 edges to [[_COMMUNITY_Flashcards & Podcast Controllers]]
- 5 edges to [[_COMMUNITY_Summary Controller]]
- 4 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 4 edges to [[_COMMUNITY_Content Controller (YouTubeOCR)]]
- 4 edges to [[_COMMUNITY_Auth Controller]]
- 3 edges to [[_COMMUNITY_Tenant Messages & Progress]]
- 2 edges to [[_COMMUNITY_AI Service (DeepSeek)]]
- 2 edges to [[_COMMUNITY_Assessment Service]]
- 2 edges to [[_COMMUNITY_Answer Grading Logic]]
- 2 edges to [[_COMMUNITY_Flashcards Page]]
- 2 edges to [[_COMMUNITY_Student Import Service]]
- 1 edge to [[_COMMUNITY_Tenant Student Management]]
- 1 edge to [[_COMMUNITY_Embedding & Chunk Inspection]]
- 1 edge to [[_COMMUNITY_Bank & Question Management]]
- 1 edge to [[_COMMUNITY_Tenant Service & Assignments]]
- 1 edge to [[_COMMUNITY_Learner Dashboard]]

## Top bridge nodes
- [[learningProgress.service.ts]] - degree 38, connects to 11 communities
- [[progress.ts]] - degree 25, connects to 8 communities
- [[mastery.service.ts]] - degree 17, connects to 7 communities
- [[buildCoverageResults()]] - degree 6, connects to 3 communities
- [[LearnerMaterial]] - degree 4, connects to 3 communities