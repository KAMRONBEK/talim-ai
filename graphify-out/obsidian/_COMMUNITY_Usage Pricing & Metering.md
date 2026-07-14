---
type: community
cohesion: 0.14
members: 27
---

# Usage Pricing & Metering

**Cohesion:** 0.14 - loosely connected
**Members:** 27 nodes

## Members
- [[PLAN_MONTHLY_PRICE_USD]] - code - apps/api/src/config/usage-pricing.ts
- [[RecordUsageInput]] - code - apps/api/src/services/usage.service.ts
- [[TOKEN_PRICING_PER_MILLION]] - code - apps/api/src/config/usage-pricing.ts
- [[UsageContext]] - code - apps/api/src/services/usage.service.ts
- [[captionAndStoreFigures()]] - code - apps/api/src/services/figure.service.ts
- [[captionPage()]] - code - apps/api/src/services/figure.service.ts
- [[clampToTokenLimit()]] - code - apps/api/src/services/embed.service.ts
- [[embed.service.ts]] - code - apps/api/src/services/embed.service.ts
- [[estimateCost()]] - code - apps/api/src/services/usage.service.ts
- [[estimateTokenCostUsd()]] - code - apps/api/src/config/usage-pricing.ts
- [[figure.service.ts]] - code - apps/api/src/services/figure.service.ts
- [[generateEmbedding()]] - code - apps/api/src/services/embed.service.ts
- [[generateEmbeddings()]] - code - apps/api/src/services/embed.service.ts
- [[getChunkStats()]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[getEmbeddingStatusByIndex()]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[getOrderedChunks()]] - code - apps/api/src/services/rag.service.ts
- [[inspect-chunks.ts]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[main()_3]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[openai_2]] - code - apps/api/src/services/embed.service.ts
- [[parseArgs()_2]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[planMonthlyPriceUsd()]] - code - apps/api/src/config/usage-pricing.ts
- [[preview()]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[recordEmbedUsage()]] - code - apps/api/src/services/embed.service.ts
- [[recordUsage()]] - code - apps/api/src/services/usage.service.ts
- [[searchWithDistance()]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[usage-pricing.ts]] - code - apps/api/src/config/usage-pricing.ts
- [[usage.service.ts]] - code - apps/api/src/services/usage.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Usage_Pricing__Metering
SORT file.name ASC
```

## Connections to other communities
- 17 edges to [[_COMMUNITY_AI Tutor Chat Controller]]
- 6 edges to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 6 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 6 edges to [[_COMMUNITY_PDF Extraction Service]]
- 4 edges to [[_COMMUNITY_Podcast Generation & TTS]]
- 4 edges to [[_COMMUNITY_YouTube Ingest Service]]
- 3 edges to [[_COMMUNITY_Admin Analytics]]
- 3 edges to [[_COMMUNITY_AI Provider Service]]
- 3 edges to [[_COMMUNITY_Subscription & Billing Service]]
- 2 edges to [[_COMMUNITY_Admin Content & Audit Controllers]]
- 2 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 2 edges to [[_COMMUNITY_Job Event Fan-out & Media Jobs]]
- 1 edge to [[_COMMUNITY_Summary Controller]]
- 1 edge to [[_COMMUNITY_AI Prompt Builders]]

## Top bridge nodes
- [[usage.service.ts]] - degree 22, connects to 9 communities
- [[UsageContext]] - degree 9, connects to 5 communities
- [[recordUsage()]] - degree 16, connects to 4 communities
- [[getOrderedChunks()]] - degree 7, connects to 4 communities
- [[figure.service.ts]] - degree 13, connects to 3 communities