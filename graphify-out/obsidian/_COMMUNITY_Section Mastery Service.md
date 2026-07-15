---
type: community
cohesion: 0.17
members: 22
---

# Section Mastery Service

**Cohesion:** 0.17 - loosely connected
**Members:** 22 nodes

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
- [[reviewFlashcard()]] - code - apps/api/src/controllers/flashcards.controller.ts
- [[scopeKeyFor()]] - code - apps/api/src/services/sectionMastery.service.ts
- [[sectionMastery.service.ts]] - code - apps/api/src/services/sectionMastery.service.ts
- [[sigmoid()]] - code - packages/types/mastery.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Section_Mastery_Service
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_Quiz Controller]]
- 4 edges to [[_COMMUNITY_Assessment Service]]
- 4 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 3 edges to [[_COMMUNITY_Flashcards & Podcast Controllers]]
- 3 edges to [[_COMMUNITY_Quiz Page & Hooks]]
- 2 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 2 edges to [[_COMMUNITY_API Endpoints & Chat UI]]
- 1 edge to [[_COMMUNITY_Content Controller (YouTubeOCR)]]
- 1 edge to [[_COMMUNITY_Answer Grading Logic]]
- 1 edge to [[_COMMUNITY_Bank & Question Management]]

## Top bridge nodes
- [[sectionMastery.service.ts]] - degree 22, connects to 7 communities
- [[MasteryBand]] - degree 5, connects to 3 communities
- [[recordAnswers()]] - degree 14, connects to 2 communities
- [[mastery.ts]] - degree 14, connects to 2 communities
- [[guessFloorForQuestion()]] - degree 4, connects to 2 communities