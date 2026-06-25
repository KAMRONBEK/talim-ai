---
source_file: "apps/api/src/jobs/generateQuiz.job.ts"
type: "code"
community: "Quiz Generation Job"
location: "L1"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/Quiz_Generation_Job
---

# generateQuiz.job.ts

## Connections
- [[GenerateQuizJobData]] - `imports` [EXTRACTED]
- [[GeneratedQuestion]] - `imports` [EXTRACTED]
- [[QuestionStyle]] - `imports` [EXTRACTED]
- [[ai.service.ts]] - `imports_from` [EXTRACTED]
- [[assessment-prompt.ts]] - `imports_from` [EXTRACTED]
- [[buildQuizUserPrompt()]] - `imports` [EXTRACTED]
- [[buildRagContext()]] - `imports` [EXTRACTED]
- [[dropParrotingQuestions()]] - `imports` [EXTRACTED]
- [[generateJsonCompletion()]] - `imports` [EXTRACTED]
- [[getQuestionCount()]] - `imports` [EXTRACTED]
- [[getQuizSystemPrompt()]] - `imports` [EXTRACTED]
- [[getSectionContext()]] - `contains` [EXTRACTED]
- [[index.ts]] - `imports_from` [EXTRACTED]
- [[index.ts_2]] - `imports_from` [EXTRACTED]
- [[isAnswerableMultipleChoice()]] - `imports` [EXTRACTED]
- [[jsonStringArray()]] - `imports` [EXTRACTED]
- [[locale-prompts.ts]] - `imports_from` [EXTRACTED]
- [[normalizeQuestionType()]] - `imports` [EXTRACTED]
- [[parseAppLocale()]] - `imports` [EXTRACTED]
- [[prisma_2]] - `imports` [EXTRACTED]
- [[prisma.ts]] - `imports_from` [EXTRACTED]
- [[question-quality.ts]] - `imports_from` [EXTRACTED]
- [[queue.service.ts]] - `imports_from` [EXTRACTED]
- [[quiz-prompt.ts]] - `imports_from` [EXTRACTED]
- [[quizQueue]] - `imports` [EXTRACTED]
- [[rag.service.ts]] - `imports_from` [EXTRACTED]
- [[registerGenerateQuizJob()]] - `contains` [EXTRACTED]
- [[searchSimilarChunks()]] - `imports` [EXTRACTED]
- [[shared.ts_1]] - `imports_from` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/Quiz_Generation_Job