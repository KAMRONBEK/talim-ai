---
type: community
cohesion: 0.21
members: 13
---

# Quiz Generation Job

**Cohesion:** 0.21 - loosely connected
**Members:** 13 nodes

## Members
- [[GeneratedQuestion]] - code - apps/api/src/services/assessment/shared.ts
- [[QuestionStyle]] - code - apps/api/src/lib/assessment-prompt.ts
- [[buildQuizUserPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[buildQuizUserPrompt()_1]] - code - apps/api/src/lib/quiz-prompt.ts
- [[dropParrotingQuestions()]] - code - apps/api/src/lib/question-quality.ts
- [[generateQuiz.job.ts]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[getQuestionCount()]] - code - apps/api/src/lib/quiz-prompt.ts
- [[getQuizSystemPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[getSectionContext()]] - code - apps/api/src/jobs/generateQuiz.job.ts
- [[isParroting()]] - code - apps/api/src/lib/question-quality.ts
- [[normalizeText()]] - code - apps/api/src/lib/question-quality.ts
- [[question-quality.ts]] - code - apps/api/src/lib/question-quality.ts
- [[quiz-prompt.ts]] - code - apps/api/src/lib/quiz-prompt.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Quiz_Generation_Job
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_AI Question Banks]]
- 5 edges to [[_COMMUNITY_Env Config & Background Job Registration]]
- 5 edges to [[_COMMUNITY_AI Summary Generation]]
- 4 edges to [[_COMMUNITY_Locale-Aware AI Prompts]]
- 2 edges to [[_COMMUNITY_Assessment Service]]
- 2 edges to [[_COMMUNITY_AI Service (DeepSeektools)]]
- 1 edge to [[_COMMUNITY_Learner Assessment Service]]
- 1 edge to [[_COMMUNITY_Chat Controller & Sessions]]
- 1 edge to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 1 edge to [[_COMMUNITY_Web API Client & Locale]]

## Top bridge nodes
- [[generateQuiz.job.ts]] - degree 29, connects to 10 communities
- [[GeneratedQuestion]] - degree 3, connects to 2 communities
- [[QuestionStyle]] - degree 3, connects to 2 communities
- [[question-quality.ts]] - degree 5, connects to 1 community
- [[dropParrotingQuestions()]] - degree 4, connects to 1 community