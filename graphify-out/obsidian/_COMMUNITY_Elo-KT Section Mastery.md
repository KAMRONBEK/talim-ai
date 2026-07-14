---
type: community
cohesion: 0.19
members: 21
---

# Elo-KT Section Mastery

**Cohesion:** 0.19 - loosely connected
**Members:** 21 nodes

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
TABLE source_file, type FROM #community/Elo-KT_Section_Mastery
SORT file.name ASC
```

## Connections to other communities
- 5 edges to [[_COMMUNITY_Shared Types & Locale]]
- 4 edges to [[_COMMUNITY_Quiz API]]
- 4 edges to [[_COMMUNITY_Learner Submission & AI Judge]]
- 3 edges to [[_COMMUNITY_Content Access & Media API]]
- 3 edges to [[_COMMUNITY_Quiz UI & Rich Text]]
- 2 edges to [[_COMMUNITY_Bull Jobs & Queues]]
- 2 edges to [[_COMMUNITY_Grading Engine]]
- 1 edge to [[_COMMUNITY_Content Panels & Sheets]]

## Top bridge nodes
- [[sectionMastery.service.ts]] - degree 22, connects to 6 communities
- [[MasteryBand]] - degree 5, connects to 3 communities
- [[recordAnswers()]] - degree 14, connects to 2 communities
- [[mastery.ts]] - degree 14, connects to 1 community
- [[recordFlashcardReview()]] - degree 5, connects to 1 community