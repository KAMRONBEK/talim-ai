---
type: community
cohesion: 0.10
members: 34
---

# Assessment Service

**Cohesion:** 0.10 - loosely connected
**Members:** 34 nodes

## Members
- [[AnswerEvidence]] - code - apps/api/src/services/sectionMastery.service.ts
- [[LeaderboardAttempt]] - code - apps/api/src/services/assessment/shared.ts
- [[QuestionStyle_1]] - code - apps/api/src/services/assessment/shared.ts
- [[SubmitAnswerValue]] - code - apps/api/src/services/assessment/shared.ts
- [[applyAiJudgeToGrades()]] - code - apps/api/src/services/answerJudge.service.ts
- [[assertLearnerAssignment()]] - code - apps/api/src/services/assessment/shared.ts
- [[assessment.service.ts]] - code - apps/api/src/services/assessment.service.ts
- [[assessments.ts]] - code - apps/api/src/services/assessment/assessments.ts
- [[assignAssessment()_1]] - code - apps/api/src/services/assessment/assessments.ts
- [[assignAssessmentSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[computeGamePoints()]] - code - apps/api/src/services/assessment/shared.ts
- [[createAssessment()_1]] - code - apps/api/src/services/assessment/assessments.ts
- [[createAssessmentSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[createBankSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[formatAssessment()]] - code - apps/api/src/services/assessment/shared.ts
- [[getAssessmentLeaderboard()]] - code - apps/api/src/services/assessment/results.ts
- [[getAssessmentResults()]] - code - apps/api/src/services/assessment/results.ts
- [[getLearnerAssessmentLeaderboard()]] - code - apps/api/src/services/assessment/learner.ts
- [[goLiveAssessmentSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[learner.ts]] - code - apps/api/src/services/assessment/learner.ts
- [[learnerDisplayName()]] - code - apps/api/src/services/assessment/shared.ts
- [[listAssessments()_1]] - code - apps/api/src/services/assessment/assessments.ts
- [[listLearnerAssessments()_1]] - code - apps/api/src/services/assessment/learner.ts
- [[questionDepthEnum]] - code - apps/api/src/services/assessment/shared.ts
- [[questionStyleEnum]] - code - apps/api/src/services/assessment/shared.ts
- [[questionTypeEnum]] - code - apps/api/src/services/assessment/shared.ts
- [[results.ts]] - code - apps/api/src/services/assessment/results.ts
- [[scheduleAssessment()_1]] - code - apps/api/src/services/assessment/assessments.ts
- [[scheduleAssessmentSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[setAssessmentLive()]] - code - apps/api/src/services/assessment/assessments.ts
- [[shared.ts_1]] - code - apps/api/src/services/assessment/shared.ts
- [[submitAnswerValueSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[submitAssessmentSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[submitLearnerAssessment()_1]] - code - apps/api/src/services/assessment/learner.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Assessment_Service
SORT file.name ASC
```

## Connections to other communities
- 15 edges to [[_COMMUNITY_Question Bank Service]]
- 12 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 9 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 8 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 4 edges to [[_COMMUNITY_Section Mastery (Elo-KT)]]
- 3 edges to [[_COMMUNITY_Quiz Player UI]]
- 2 edges to [[_COMMUNITY_Question Post-processing]]
- 2 edges to [[_COMMUNITY_Answer Grading Engine]]
- 2 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 2 edges to [[_COMMUNITY_AI Tutor Chat Controller]]
- 1 edge to [[_COMMUNITY_Assessment Controller]]
- 1 edge to [[_COMMUNITY_Quiz Generation Pipeline]]
- 1 edge to [[_COMMUNITY_Learning Progress & Coverage]]
- 1 edge to [[_COMMUNITY_In-Process Job Event Bus]]
- 1 edge to [[_COMMUNITY_API Bootstrap & Background Jobs]]

## Top bridge nodes
- [[learner.ts]] - degree 28, connects to 10 communities
- [[shared.ts_1]] - degree 45, connects to 9 communities
- [[assessments.ts]] - degree 16, connects to 2 communities
- [[results.ts]] - degree 11, connects to 2 communities
- [[applyAiJudgeToGrades()]] - degree 8, connects to 2 communities