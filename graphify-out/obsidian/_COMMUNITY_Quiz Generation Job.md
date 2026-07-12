---
type: community
cohesion: 0.08
members: 40
---

# Quiz Generation Job

**Cohesion:** 0.08 - loosely connected
**Members:** 40 nodes

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
- [[generateQuiz.job.ts]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[getQuestionGenSystemPrompt()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[getSectionChunks()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[normalizeAssessmentQuestionType()]] - code - apps/api/src/lib/assessment-prompt.ts
- [[normalizePracticeQuestionType()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[normalizeQuestionType()]] - code - apps/api/src/lib/assessment-prompt.ts
- [[overgenerateCount()]] - code - apps/api/src/lib/question-postprocess.ts
- [[question-gen-prompt.ts]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[question-gen.ts]] - code - apps/api/src/lib/question-gen.ts
- [[resolveSourceSection()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[styleInstruction()]] - code - apps/api/src/lib/assessment-prompt.ts
- [[typeRules()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[wholeMaterialTarget()]] - code - apps/api/src/jobs/generateQuiz.job.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Quiz_Generation_Job
SORT file.name ASC
```

## Connections to other communities
- 13 edges to [[_COMMUNITY_Assessments Service]]
- 7 edges to [[_COMMUNITY_Community 40]]
- 6 edges to [[_COMMUNITY_Flashcards Generation & Jobs]]
- 4 edges to [[_COMMUNITY_Shared Types]]
- 3 edges to [[_COMMUNITY_Content Hooks & Locale]]
- 2 edges to [[_COMMUNITY_Admin Tenants API]]
- 2 edges to [[_COMMUNITY_AI Tutor Chat API]]
- 2 edges to [[_COMMUNITY_Podcast Generation & Prompts]]
- 2 edges to [[_COMMUNITY_Community 46]]
- 2 edges to [[_COMMUNITY_Assessment Pages & Wizard]]
- 1 edge to [[_COMMUNITY_Community 91]]
- 1 edge to [[_COMMUNITY_Community 32]]
- 1 edge to [[_COMMUNITY_Community 105]]
- 1 edge to [[_COMMUNITY_Community 36]]
- 1 edge to [[_COMMUNITY_Quiz Player & Hooks]]

## Top bridge nodes
- [[generateQuiz.job.ts]] - degree 32, connects to 8 communities
- [[question-gen.ts]] - degree 22, connects to 5 communities
- [[QuestionDepth]] - degree 10, connects to 4 communities
- [[question-gen-prompt.ts]] - degree 26, connects to 3 communities
- [[assessment-prompt.ts]] - degree 10, connects to 2 communities