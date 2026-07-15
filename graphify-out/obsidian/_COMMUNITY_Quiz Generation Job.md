---
type: community
cohesion: 0.08
members: 41
---

# Quiz Generation Job

**Cohesion:** 0.08 - loosely connected
**Members:** 41 nodes

## Members
- [[AVOID_STEMS_LABEL]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[AssessmentQuestionStyle]] - code - apps/api/src/lib/assessment-prompt.ts
- [[CONTEXT_LABELS]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[ContextChunk]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[DEFAULT_MIX_TYPES]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[DEPTH_INSTRUCTIONS]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[GENERATABLE_TYPES]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[GeneratableQuestionType]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[GenerateOptions]] - code - apps/api/src/lib/question-gen.ts
- [[GenerateQuizJobData]] - code - apps/api/src/services/queue.service.ts
- [[MIXED_DEPTH]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[ProcessedQuestion]] - code - apps/api/src/lib/question-postprocess.ts
- [[QuestionDepth]] - code - packages/types/index.ts
- [[QuestionGenPromptInput]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[QuestionSetRequest]] - code - apps/api/src/lib/question-gen.ts
- [[QuestionSetResult]] - code - apps/api/src/lib/question-gen.ts
- [[QuestionStyle]] - code - apps/api/src/lib/assessment-prompt.ts
- [[SYSTEM_PROMPTS]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[SkipReason]] - code - apps/api/src/lib/question-postprocess.ts
- [[TRUE_FALSE_OPTIONS]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[TYPES_REQUIREMENT]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[TYPE_NAMES]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[assessment-prompt.ts]] - code - apps/api/src/lib/assessment-prompt.ts
- [[buildQuestionGenPrompt()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[containmentNormalize()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[depthInstruction()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[generateQuestionSet()]] - code - apps/api/src/lib/question-gen.ts
- [[generateQuiz.job.ts]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[getQuestionGenSystemPrompt()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[getSectionChunks()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[normalizeAssessmentQuestionType()]] - code - apps/api/src/lib/assessment-prompt.ts
- [[normalizePracticeQuestionType()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[overgenerateCount()]] - code - apps/api/src/lib/question-postprocess.ts
- [[question-gen-prompt.ts]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[question-gen.ts]] - code - apps/api/src/lib/question-gen.ts
- [[quizQueue]] - code - apps/api/src/services/queue.service.ts
- [[resolveRequestedTypes()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[resolveSourceSection()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[typeRules()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[typesFromStyle()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[wholeMaterialTarget()]] - code - apps/api/src/jobs/generateQuiz.job.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Quiz_Generation_Job
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 9 edges to [[_COMMUNITY_Bank & Question Management]]
- 7 edges to [[_COMMUNITY_Question Postprocessing]]
- 4 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 3 edges to [[_COMMUNITY_Assessment Service]]
- 3 edges to [[_COMMUNITY_Flashcards Page]]
- 2 edges to [[_COMMUNITY_Locale Prompts (TutorPodcastSummary)]]
- 2 edges to [[_COMMUNITY_AI Service (DeepSeek)]]
- 1 edge to [[_COMMUNITY_Quiz Controller]]
- 1 edge to [[_COMMUNITY_Embedding & Chunk Inspection]]
- 1 edge to [[_COMMUNITY_Summary Controller]]
- 1 edge to [[_COMMUNITY_Chat Controller (SSE)]]
- 1 edge to [[_COMMUNITY_Flashcards & Podcast Controllers]]
- 1 edge to [[_COMMUNITY_Tenant Assessments Page]]
- 1 edge to [[_COMMUNITY_Login & Assign Content]]
- 1 edge to [[_COMMUNITY_Assessment Leaderboard]]
- 1 edge to [[_COMMUNITY_Quiz Page & Hooks]]

## Top bridge nodes
- [[generateQuiz.job.ts]] - degree 32, connects to 7 communities
- [[question-gen.ts]] - degree 22, connects to 6 communities
- [[QuestionDepth]] - degree 10, connects to 5 communities
- [[question-gen-prompt.ts]] - degree 26, connects to 3 communities
- [[generateQuestionSet()]] - degree 8, connects to 2 communities