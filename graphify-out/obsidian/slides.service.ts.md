---
source_file: "apps/api/src/services/slides.service.ts"
type: "code"
community: "AI Slide-Deck Prompting"
location: "L1"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/AI_Slide-Deck_Prompting
---

# slides.service.ts

## Connections
- [[AppError]] - `imports` [EXTRACTED]
- [[AppLocale]] - `imports` [EXTRACTED]
- [[ContentSlideDeck]] - `imports` [EXTRACTED]
- [[Deck]] - `imports` [EXTRACTED]
- [[DeckAudience]] - `imports` [EXTRACTED]
- [[DeckSlide]] - `imports` [EXTRACTED]
- [[Env]] - `imports` [EXTRACTED]
- [[Overrides]] - `contains` [EXTRACTED]
- [[QuotaExceededError]] - `imports` [EXTRACTED]
- [[SlideDeckRow]] - `contains` [EXTRACTED]
- [[ai.service.ts]] - `imports_from` [EXTRACTED]
- [[assertQuota()]] - `imports` [EXTRACTED]
- [[autoGenerateSectionDecks()]] - `contains` [EXTRACTED]
- [[boundContextByTokens()]] - `imports` [EXTRACTED]
- [[buildContext()]] - `contains` [EXTRACTED]
- [[buildDeckUserPrompt()]] - `imports` [EXTRACTED]
- [[buildRagContext()]] - `imports` [EXTRACTED]
- [[coerceDeck()]] - `contains` [EXTRACTED]
- [[content.controller.ts_1]] - `imports_from` [EXTRACTED]
- [[deck-prompt.ts]] - `imports_from` [EXTRACTED]
- [[deck-schema.ts]] - `imports_from` [EXTRACTED]
- [[deckSchema]] - `imports` [EXTRACTED]
- [[deckScopeKey()]] - `contains` [EXTRACTED]
- [[deriveTitle()]] - `contains` [EXTRACTED]
- [[env.ts]] - `imports_from` [EXTRACTED]
- [[error.middleware.ts]] - `imports_from` [EXTRACTED]
- [[estimatedMinutesFor()]] - `imports` [EXTRACTED]
- [[formatSlideDeck()]] - `contains` [EXTRACTED]
- [[generateAndStoreSlideDeck()]] - `contains` [EXTRACTED]
- [[generateJsonCompletion()]] - `imports` [EXTRACTED]
- [[generateSlideDeck()]] - `contains` [EXTRACTED]
- [[getDeckSystemPrompt()]] - `imports` [EXTRACTED]
- [[getOrderedChunks()]] - `imports` [EXTRACTED]
- [[getReadySlideDeckAnyLocale()]] - `contains` [EXTRACTED]
- [[getSectionBody()]] - `imports` [EXTRACTED]
- [[getSlideDeck()]] - `contains` [EXTRACTED]
- [[index.ts_2]] - `imports_from` [EXTRACTED]
- [[isRecord()]] - `contains` [EXTRACTED]
- [[normalizeSlide()]] - `contains` [EXTRACTED]
- [[pickAccent()]] - `imports` [EXTRACTED]
- [[prisma_2]] - `imports` [EXTRACTED]
- [[prisma.ts]] - `imports_from` [EXTRACTED]
- [[processContent.job.ts]] - `imports_from` [EXTRACTED]
- [[rag.service.ts]] - `imports_from` [EXTRACTED]
- [[section.service.ts]] - `imports_from` [EXTRACTED]
- [[slideSchema]] - `imports` [EXTRACTED]
- [[slides.controller.ts]] - `imports_from` [EXTRACTED]
- [[subscription.service.ts]] - `imports_from` [EXTRACTED]
- [[targetSlideCount()]] - `imports` [EXTRACTED]
- [[tenant-content.controller.ts]] - `imports_from` [EXTRACTED]
- [[toBulletObjects()]] - `contains` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/AI_Slide-Deck_Prompting