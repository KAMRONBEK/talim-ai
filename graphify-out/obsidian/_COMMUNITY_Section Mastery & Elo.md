---
type: community
cohesion: 0.19
members: 21
---

# Section Mastery & Elo

**Cohesion:** 0.19 - loosely connected
**Members:** 21 nodes

## Members
- [[EloUpdateInput]] - code - packages/types/mastery.ts
- [[EloUpdateResult]] - code - packages/types/mastery.ts
- [[MASTERY_BANDS]] - code - packages/types/mastery.ts
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
- [[scopeKeyFor()]] - code - apps/api/src/services/sectionMastery.service.ts
- [[sectionMastery.service.ts]] - code - apps/api/src/services/sectionMastery.service.ts
- [[sigmoid()]] - code - packages/types/mastery.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Section_Mastery__Elo
SORT file.name ASC
```

## Connections to other communities
- 5 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 4 edges to [[_COMMUNITY_Quiz API Controller]]
- 4 edges to [[_COMMUNITY_Assessments Service]]
- 4 edges to [[_COMMUNITY_Shared Types & Auth Stores]]
- 3 edges to [[_COMMUNITY_Quiz Player & Hooks]]
- 2 edges to [[_COMMUNITY_Content Workspace & Chat]]
- 1 edge to [[_COMMUNITY_Grading Engine Types]]
- 1 edge to [[_COMMUNITY_Question Banks & Builders]]

## Top bridge nodes
- [[sectionMastery.service.ts]] - degree 22, connects to 6 communities
- [[MasteryBand]] - degree 5, connects to 3 communities
- [[recordAnswers()]] - degree 14, connects to 2 communities
- [[mastery.ts]] - degree 14, connects to 2 communities
- [[guessFloorForQuestion()]] - degree 4, connects to 2 communities