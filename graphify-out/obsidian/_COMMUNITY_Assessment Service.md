---
type: community
cohesion: 0.11
members: 32
---

# Assessment Service

**Cohesion:** 0.11 - loosely connected
**Members:** 32 nodes

## Members
- [[AnswerEvidence]] - code - apps/api/src/services/sectionMastery.service.ts
- [[LeaderboardAttempt]] - code - apps/api/src/services/assessment/shared.ts
- [[SampledChunk]] - code - apps/api/src/lib/chunk-sampling.ts
- [[applyAiJudgeToGrades()]] - code - apps/api/src/services/answerJudge.service.ts
- [[assertLearnerAssignment()]] - code - apps/api/src/services/assessment/shared.ts
- [[assessment.service.ts]] - code - apps/api/src/services/assessment.service.ts
- [[assessments.ts]] - code - apps/api/src/services/assessment/assessments.ts
- [[assignAssessment()_1]] - code - apps/api/src/services/assessment/assessments.ts
- [[assignAssessmentSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[chunk-sampling.ts]] - code - apps/api/src/lib/chunk-sampling.ts
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
- [[questionTypeEnum]] - code - apps/api/src/services/assessment/shared.ts
- [[results.ts]] - code - apps/api/src/services/assessment/results.ts
- [[sampleChunksEvenly()]] - code - apps/api/src/lib/chunk-sampling.ts
- [[scheduleAssessment()_1]] - code - apps/api/src/services/assessment/assessments.ts
- [[scheduleAssessmentSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[setAssessmentLive()]] - code - apps/api/src/services/assessment/assessments.ts
- [[shared.ts_1]] - code - apps/api/src/services/assessment/shared.ts
- [[submitAssessmentSchema]] - code - apps/api/src/services/assessment/shared.ts
- [[submitLearnerAssessment()_1]] - code - apps/api/src/services/assessment/learner.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Assessment_Service
SORT file.name ASC
```

## Connections to other communities
- 17 edges to [[_COMMUNITY_Bank & Question Management]]
- 11 edges to [[_COMMUNITY_Quiz Controller]]
- 10 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 8 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 4 edges to [[_COMMUNITY_Section Mastery Service]]
- 3 edges to [[_COMMUNITY_Quiz Generation Job]]
- 2 edges to [[_COMMUNITY_Question Postprocessing]]
- 2 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 2 edges to [[_COMMUNITY_Job Event Bus]]
- 2 edges to [[_COMMUNITY_Answer Grading Logic]]
- 2 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 1 edge to [[_COMMUNITY_Assessment Controller]]
- 1 edge to [[_COMMUNITY_Quiz Page & Hooks]]
- 1 edge to [[_COMMUNITY_Embedding & Chunk Inspection]]
- 1 edge to [[_COMMUNITY_Summary Controller]]

## Top bridge nodes
- [[shared.ts_1]] - degree 43, connects to 9 communities
- [[learner.ts]] - degree 28, connects to 9 communities
- [[assessments.ts]] - degree 16, connects to 2 communities
- [[results.ts]] - degree 11, connects to 2 communities
- [[applyAiJudgeToGrades()]] - degree 8, connects to 2 communities