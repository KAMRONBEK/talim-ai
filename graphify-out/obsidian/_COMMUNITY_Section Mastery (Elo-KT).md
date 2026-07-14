---
type: community
cohesion: 0.16
members: 23
---

# Section Mastery (Elo-KT)

**Cohesion:** 0.16 - loosely connected
**Members:** 23 nodes

## Members
- [[EloUpdateInput]] - code - packages/types/mastery.ts
- [[EloUpdateResult]] - code - packages/types/mastery.ts
- [[MASTERY_BANDS]] - code - packages/types/mastery.ts
- [[MASTERY_BAND_ORDER]] - code - packages/types/mastery.ts
- [[MasteryBand]] - code - packages/types/mastery.ts
- [[SectionMasteryInfo]] - code - packages/types/index.ts
- [[bandIndex()]] - code - packages/types/mastery.ts
- [[dayStamp()]] - code - apps/api/src/services/sectionMastery.service.ts
- [[decayedTheta()]] - code - packages/types/mastery.ts
- [[difficultyPrior()]] - code - packages/types/mastery.ts
- [[eloUpdate()]] - code - packages/types/mastery.ts
- [[flashcardEvidence()]] - code - packages/types/mastery.ts
- [[getContentMastery()_1]] - code - apps/api/src/services/sectionMastery.service.ts
- [[guessFloorForQuestion()]] - code - packages/types/grading.ts
- [[mastery.ts]] - code - packages/types/mastery.ts
- [[masteryScore()]] - code - packages/types/mastery.ts
- [[recordAnswers()]] - code - apps/api/src/services/sectionMastery.service.ts
- [[recordFlashcardReview()]] - code - apps/api/src/services/sectionMastery.service.ts
- [[resolveMasteryBand()]] - code - packages/types/mastery.ts
- [[reviewFlashcard()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[scopeKeyFor()]] - code - apps/api/src/services/sectionMastery.service.ts
- [[sectionMastery.service.ts]] - code - apps/api/src/services/sectionMastery.service.ts
- [[sigmoid()]] - code - packages/types/mastery.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Section_Mastery_Elo-KT
SORT file.name ASC
```

## Connections to other communities
- 5 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 4 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 4 edges to [[_COMMUNITY_Assessment Service]]
- 3 edges to [[_COMMUNITY_Content Media Controllers]]
- 3 edges to [[_COMMUNITY_Quiz Player UI]]
- 2 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 1 edge to [[_COMMUNITY_Assessment Controller]]
- 1 edge to [[_COMMUNITY_Sheet & Layout Components]]
- 1 edge to [[_COMMUNITY_Answer Grading Engine]]
- 1 edge to [[_COMMUNITY_Question Bank Service]]

## Top bridge nodes
- [[sectionMastery.service.ts]] - degree 22, connects to 6 communities
- [[MasteryBand]] - degree 5, connects to 3 communities
- [[recordAnswers()]] - degree 14, connects to 2 communities
- [[guessFloorForQuestion()]] - degree 4, connects to 2 communities
- [[reviewFlashcard()]] - degree 3, connects to 2 communities