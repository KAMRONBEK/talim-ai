---
type: community
cohesion: 0.07
members: 45
---

# Quiz Generation Job

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
- [[getSectionContext()]] - code - apps/api/src/services/assessment/shared.ts
- [[normalizeAssessmentQuestionType()]] - code - apps/api/src/lib/assessment-prompt.ts
- [[normalizePracticeQuestionType()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[normalizeQuestionType()]] - code - apps/api/src/lib/assessment-prompt.ts
- [[overgenerateCount()]] - code - apps/api/src/lib/question-postprocess.ts
- [[question-gen-prompt.ts]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[question-gen.ts]] - code - apps/api/src/lib/question-gen.ts
- [[resolveRequestedTypes()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[resolveSourceSection()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[sampleChunksEvenly()]] - code - apps/api/src/lib/chunk-sampling.ts
- [[styleInstruction()]] - code - apps/api/src/lib/assessment-prompt.ts
- [[typeRules()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[typesFromStyle()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[wholeMaterialTarget()]] - code - apps/api/src/jobs/generateQuiz.job.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Quiz_Generation_Job
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_Question Banks & Builders]]
- 7 edges to [[_COMMUNITY_Question Post-processing]]
- 4 edges to [[_COMMUNITY_Background Jobs & Queues]]
- 4 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 4 edges to [[_COMMUNITY_AI Tutor Chat API]]
- 4 edges to [[_COMMUNITY_Shared Types & Auth Stores]]
- 3 edges to [[_COMMUNITY_Assessments Service]]
- 3 edges to [[_COMMUNITY_Content Grid & Learner Dashboard]]
- 2 edges to [[_COMMUNITY_Job Registration & Manim]]
- 2 edges to [[_COMMUNITY_Community 98]]
- 2 edges to [[_COMMUNITY_Locale AI Prompts]]
- 2 edges to [[_COMMUNITY_AI Provider Service]]
- 2 edges to [[_COMMUNITY_Assessment Pages & Wizard]]
- 1 edge to [[_COMMUNITY_Providers & Job Events]]
- 1 edge to [[_COMMUNITY_Dialog & Button UI]]
- 1 edge to [[_COMMUNITY_Quiz Player & Hooks]]

## Top bridge nodes
- [[generateQuiz.job.ts]] - degree 32, connects to 7 communities
- [[question-gen.ts]] - degree 22, connects to 6 communities
- [[QuestionDepth]] - degree 10, connects to 4 communities
- [[question-gen-prompt.ts]] - degree 26, connects to 3 communities
- [[getSectionContext()]] - degree 5, connects to 3 communities