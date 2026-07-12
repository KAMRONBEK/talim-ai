---
type: community
cohesion: 0.15
members: 24
---

# Config, Pricing & Embeddings

**Cohesion:** 0.15 - loosely connected
**Members:** 24 nodes

## Members
- [[Env]] - code - apps/api/src/config/env.ts
- [[ImpersonationClaims]] - code - apps/api/src/lib/impersonation.ts
- [[PLAN_MONTHLY_PRICE_USD]] - code - apps/api/src/config/usage-pricing.ts
- [[RecordUsageInput]] - code - apps/api/src/services/usage.service.ts
- [[TOKEN_PRICING_PER_MILLION]] - code - apps/api/src/config/usage-pricing.ts
- [[UsageContext]] - code - apps/api/src/services/usage.service.ts
- [[captionAndStoreFigures()]] - code - apps/api/src/services/figure.service.ts
- [[captionPage()]] - code - apps/api/src/services/figure.service.ts
- [[embed.service.ts]] - code - apps/api/src/services/embed.service.ts
- [[embeddingToSql()]] - code - apps/api/src/services/embed.service.ts
- [[env.ts]] - code - apps/api/src/config/env.ts
- [[envSchema]] - code - apps/api/src/config/env.ts
- [[estimateCost()]] - code - apps/api/src/services/usage.service.ts
- [[estimateTokenCostUsd()]] - code - apps/api/src/config/usage-pricing.ts
- [[figure.service.ts]] - code - apps/api/src/services/figure.service.ts
- [[generateEmbeddings()]] - code - apps/api/src/services/embed.service.ts
- [[impersonation.ts]] - code - apps/api/src/lib/impersonation.ts
- [[loadEnv()]] - code - apps/api/src/config/env.ts
- [[openai_2]] - code - apps/api/src/services/embed.service.ts
- [[planMonthlyPriceUsd()]] - code - apps/api/src/config/usage-pricing.ts
- [[recordEmbedUsage()]] - code - apps/api/src/services/embed.service.ts
- [[recordUsage()]] - code - apps/api/src/services/usage.service.ts
- [[usage-pricing.ts]] - code - apps/api/src/config/usage-pricing.ts
- [[usage.service.ts]] - code - apps/api/src/services/usage.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Config_Pricing__Embeddings
SORT file.name ASC
```

## Connections to other communities
- 18 edges to [[_COMMUNITY_Content API Controller]]
- 9 edges to [[_COMMUNITY_AI Tutor Chat API]]
- 8 edges to [[_COMMUNITY_PDF & OCR Service]]
- 6 edges to [[_COMMUNITY_Background Jobs & Queues]]
- 6 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 6 edges to [[_COMMUNITY_Podcast Generation & Prompts]]
- 6 edges to [[_COMMUNITY_YouTube Transcript Service]]
- 6 edges to [[_COMMUNITY_Community 95]]
- 5 edges to [[_COMMUNITY_AI Provider Service]]
- 4 edges to [[_COMMUNITY_Job Registration & Manim]]
- 4 edges to [[_COMMUNITY_Billing, Usage & Limits]]
- 3 edges to [[_COMMUNITY_Admin Analytics]]
- 3 edges to [[_COMMUNITY_Admin Content & Audit]]
- 2 edges to [[_COMMUNITY_Auth API Controller]]
- 2 edges to [[_COMMUNITY_API Middleware]]
- 2 edges to [[_COMMUNITY_Slide Deck Prompts]]

## Top bridge nodes
- [[env.ts]] - degree 23, connects to 12 communities
- [[Env]] - degree 21, connects to 12 communities
- [[usage.service.ts]] - degree 22, connects to 9 communities
- [[UsageContext]] - degree 9, connects to 5 communities
- [[recordUsage()]] - degree 16, connects to 4 communities