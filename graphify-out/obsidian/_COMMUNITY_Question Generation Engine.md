---
type: community
cohesion: 0.08
members: 47
---

# Question Generation Engine

**Cohesion:** 0.08 - loosely connected
**Members:** 47 nodes

## Members
- [[AVOID_STEMS_LABEL]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[BANNED_OPTION_PATTERNS]] - code - apps/api/src/lib/question-postprocess.ts
- [[CONTEXT_LABELS]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[DEFAULT_MIX_TYPES]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[DEPTH_INSTRUCTIONS]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[GENERATABLE_TYPES]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[GeneratableQuestionType]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[GenerateOptions]] - code - apps/api/src/lib/question-gen.ts
- [[GeneratedQuestion]] - code - apps/api/src/services/assessment/shared.ts
- [[MIXED_DEPTH]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[PostprocessInput]] - code - apps/api/src/lib/question-postprocess.ts
- [[PostprocessResult]] - code - apps/api/src/lib/question-postprocess.ts
- [[ProcessedQuestion]] - code - apps/api/src/lib/question-postprocess.ts
- [[QuestionDepth]] - code - packages/types/index.ts
- [[QuestionGenPromptInput]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[QuestionSetRequest]] - code - apps/api/src/lib/question-gen.ts
- [[QuestionSetResult]] - code - apps/api/src/lib/question-gen.ts
- [[SYSTEM_PROMPTS]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[SkipReason]] - code - apps/api/src/lib/question-postprocess.ts
- [[TRUE_FALSE_OPTIONS]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[TYPES_REQUIREMENT]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[TYPE_NAMES]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[buildQuestionGenPrompt()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[canonicalizeMathDelimiters()]] - code - apps/api/src/lib/question-postprocess.ts
- [[canonicalizeNullable()]] - code - apps/api/src/lib/question-postprocess.ts
- [[containmentNormalize()_1]] - code - apps/api/src/lib/question-postprocess.ts
- [[depthInstruction()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[dropParrotingQuestions()]] - code - apps/api/src/lib/question-quality.ts
- [[generateQuestionSet()]] - code - apps/api/src/lib/question-gen.ts
- [[getQuestionGenSystemPrompt()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[hasBannedOption()]] - code - apps/api/src/lib/question-postprocess.ts
- [[isParroting()]] - code - apps/api/src/lib/question-quality.ts
- [[normalizePracticeQuestionType()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[normalizeText()]] - code - apps/api/src/lib/question-quality.ts
- [[overgenerateCount()]] - code - apps/api/src/lib/question-postprocess.ts
- [[postprocessGeneratedQuestions()]] - code - apps/api/src/lib/question-postprocess.ts
- [[question-gen-prompt.ts]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[question-gen.ts]] - code - apps/api/src/lib/question-gen.ts
- [[question-postprocess.ts]] - code - apps/api/src/lib/question-postprocess.ts
- [[question-quality.ts]] - code - apps/api/src/lib/question-quality.ts
- [[sanitizeBloom()]] - code - apps/api/src/lib/question-postprocess.ts
- [[sanitizeDifficulty()]] - code - apps/api/src/lib/question-postprocess.ts
- [[sanitizeRationales()]] - code - apps/api/src/lib/question-postprocess.ts
- [[shuffleOptionsWithKey()]] - code - apps/api/src/lib/question-postprocess.ts
- [[shuffled()]] - code - apps/api/src/lib/question-builders.ts
- [[typeRules()]] - code - apps/api/src/lib/question-gen-prompt.ts
- [[verifySourceQuote()]] - code - apps/api/src/lib/question-postprocess.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Question_Generation_Engine
SORT file.name ASC
```

## Connections to other communities
- 21 edges to [[_COMMUNITY_Community 29]]
- 7 edges to [[_COMMUNITY_Env Config & Job Events]]
- 7 edges to [[_COMMUNITY_Shared Types & Chat Hooks]]
- 4 edges to [[_COMMUNITY_Community 70]]
- 3 edges to [[_COMMUNITY_Assessments Service]]
- 2 edges to [[_COMMUNITY_Community 114]]
- 2 edges to [[_COMMUNITY_Community 64]]
- 2 edges to [[_COMMUNITY_Assessment Pages & Wizard]]
- 1 edge to [[_COMMUNITY_Community 39]]
- 1 edge to [[_COMMUNITY_Quiz Player & Hooks]]

## Top bridge nodes
- [[question-gen.ts]] - degree 22, connects to 5 communities
- [[QuestionDepth]] - degree 10, connects to 5 communities
- [[question-postprocess.ts]] - degree 30, connects to 4 communities
- [[question-gen-prompt.ts]] - degree 26, connects to 4 communities
- [[postprocessGeneratedQuestions()]] - degree 19, connects to 2 communities