---
type: community
cohesion: 0.07
members: 45
---

# Question Generation Pipeline

**Cohesion:** 0.07 - loosely connected
**Members:** 45 nodes

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
- [[buildAssessmentPrompt()]] - code - apps/api/src/lib/assessment-prompt.ts
- [[buildQuestionGenPrompt()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[containmentNormalize()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[depthInstruction()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[generateQuestionSet()]] - code - apps/api/src/lib/question-gen.ts
- [[generateQuestions()_1]] - code - apps/api/src/services/assessment/banks.ts
- [[generateQuiz.job.ts]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[getQuestionGenSystemPrompt()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[getSectionChunks()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[normalizeAssessmentQuestionType()]] - code - apps/api/src/lib/assessment-prompt.ts
- [[normalizePracticeQuestionType()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[normalizeQuestionType()]] - code - apps/api/src/lib/assessment-prompt.ts
- [[overgenerateCount()]] - code - apps/api/src/lib/question-postprocess.ts
- [[question-gen-prompt.ts]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[question-gen.ts]] - code - apps/api/src/lib/question-gen.ts
- [[quizQueue]] - code - apps/api/src/services/queue.service.ts
- [[resolveRequestedTypes()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[resolveSourceSection()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[styleInstruction()]] - code - apps/api/src/lib/assessment-prompt.ts
- [[typeRules()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[typesFromStyle()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[wholeMaterialTarget()]] - code - apps/api/src/jobs/generateQuiz.job.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Question_Generation_Pipeline
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_Bull Jobs & Queues]]
- 9 edges to [[_COMMUNITY_Question Bank Builders]]
- 7 edges to [[_COMMUNITY_Question Postprocessing]]
- 4 edges to [[_COMMUNITY_Assessment Services]]
- 4 edges to [[_COMMUNITY_Shared Types & Locale]]
- 3 edges to [[_COMMUNITY_RAG Retrieval]]
- 3 edges to [[_COMMUNITY_Content Stage & Limits]]
- 2 edges to [[_COMMUNITY_Admin API Controllers]]
- 2 edges to [[_COMMUNITY_AI Prompt Builders]]
- 2 edges to [[_COMMUNITY_AI Summary & Ingest]]
- 2 edges to [[_COMMUNITY_Assessments & Game Quiz UI]]
- 1 edge to [[_COMMUNITY_Quiz API]]
- 1 edge to [[_COMMUNITY_Practice & Content Dialogs]]
- 1 edge to [[_COMMUNITY_Quiz UI & Rich Text]]

## Top bridge nodes
- [[question-gen.ts]] - degree 22, connects to 6 communities
- [[generateQuiz.job.ts]] - degree 32, connects to 5 communities
- [[QuestionDepth]] - degree 10, connects to 4 communities
- [[generateQuestions()_1]] - degree 7, connects to 4 communities
- [[question-gen-prompt.ts]] - degree 26, connects to 3 communities