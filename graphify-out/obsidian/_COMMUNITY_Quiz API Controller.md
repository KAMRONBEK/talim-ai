---
type: community
cohesion: 0.16
members: 20
---

# Quiz API Controller

**Cohesion:** 0.16 - loosely connected
**Members:** 20 nodes

## Members
- [[QuizEvaluation]] - code - apps/api/src/controllers/quiz.controller.ts
- [[QuizQuestionForEvaluation]] - code - apps/api/src/controllers/quiz.controller.ts
- [[assertQuizAccess()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[createQuizSchema]] - code - apps/api/src/controllers/quiz.controller.ts
- [[evaluateQuizAnswers()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[formatAttempt()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[formatQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getContentMastery()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getLatestAttempt()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[getSubmittedOptionLabel()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[listAttempts()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[normalizeForOptionMatch()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[practiceTypeEnum]] - code - apps/api/src/controllers/quiz.controller.ts
- [[quiz.controller.ts]] - code - apps/api/src/controllers/quiz.controller.ts
- [[quizCreatorUserId()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[resolveSubmittedAnswer()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[stripSubmittedOptionLabel()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[submitQuiz()]] - code - apps/api/src/controllers/quiz.controller.ts
- [[submitSchema]] - code - apps/api/src/controllers/quiz.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Quiz_API_Controller
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_Media & Progress Controllers]]
- 7 edges to [[_COMMUNITY_Assessments Service]]
- 7 edges to [[_COMMUNITY_Assessment & Tutor-Request Controllers]]
- 4 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 4 edges to [[_COMMUNITY_Billing, Usage & Limits]]
- 4 edges to [[_COMMUNITY_Section Mastery & Elo]]
- 3 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 3 edges to [[_COMMUNITY_Grading Engine Types]]
- 3 edges to [[_COMMUNITY_Question Banks & Builders]]
- 2 edges to [[_COMMUNITY_Background Jobs & Queues]]
- 1 edge to [[_COMMUNITY_Admin Content & Audit]]
- 1 edge to [[_COMMUNITY_Shared Types & Auth Stores]]
- 1 edge to [[_COMMUNITY_Quiz Player & Hooks]]
- 1 edge to [[_COMMUNITY_API Middleware]]

## Top bridge nodes
- [[quiz.controller.ts]] - degree 55, connects to 14 communities
- [[evaluateQuizAnswers()]] - degree 7, connects to 3 communities
- [[submitQuiz()]] - degree 7, connects to 3 communities
- [[formatQuiz()]] - degree 4, connects to 2 communities
- [[getContentMastery()]] - degree 3, connects to 2 communities