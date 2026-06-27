---
type: community
cohesion: 0.12
members: 39
---

# Usage Pricing & Chunk Tools

**Cohesion:** 0.12 - loosely connected
**Members:** 39 nodes

## Members
- [[FIGURE_LABEL]] - code - apps/api/src/services/rag.service.ts
- [[RecordUsageInput]] - code - apps/api/src/services/usage.service.ts
- [[TOKEN_PRICING_PER_MILLION]] - code - apps/api/src/config/usage-pricing.ts
- [[UsageContext]] - code - apps/api/src/services/usage.service.ts
- [[buildRagContext()]] - code - apps/api/src/services/rag.service.ts
- [[captionPage()]] - code - apps/api/src/services/figure.service.ts
- [[chunkText()]] - code - apps/api/src/services/rag.service.ts
- [[clampToTokenLimit()]] - code - apps/api/src/services/embed.service.ts
- [[countTokens()]] - code - apps/api/src/services/rag.service.ts
- [[embed.service.ts]] - code - apps/api/src/services/embed.service.ts
- [[embeddingToSql()]] - code - apps/api/src/services/embed.service.ts
- [[estimateCost()]] - code - apps/api/src/services/usage.service.ts
- [[estimateTokenCostUsd()]] - code - apps/api/src/config/usage-pricing.ts
- [[figure.service.ts]] - code - apps/api/src/services/figure.service.ts
- [[generateContentSections()]] - code - apps/api/src/services/section.service.ts
- [[generateEmbedding()]] - code - apps/api/src/services/embed.service.ts
- [[generateEmbeddings()]] - code - apps/api/src/services/embed.service.ts
- [[getChunkStats()]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[getEmbeddingStatusByIndex()]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[getRagChunkLabel()]] - code - apps/api/src/lib/locale-prompts.ts
- [[ingest.service.ts]] - code - apps/api/src/services/ingest.service.ts
- [[ingestText()]] - code - apps/api/src/services/ingest.service.ts
- [[inspect-chunks.ts]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[main()_3]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[openai_2]] - code - apps/api/src/services/embed.service.ts
- [[parseArgs()_2]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[preview()]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[rag.service.ts]] - code - apps/api/src/services/rag.service.ts
- [[recordEmbedUsage()]] - code - apps/api/src/services/embed.service.ts
- [[recordUsage()]] - code - apps/api/src/services/usage.service.ts
- [[rerank()]] - code - apps/api/src/services/rag.service.ts
- [[searchSimilarChunks()]] - code - apps/api/src/services/rag.service.ts
- [[searchWithDistance()]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[splitByTokens()]] - code - apps/api/src/services/rag.service.ts
- [[storeChunksWithEmbeddings()]] - code - apps/api/src/services/rag.service.ts
- [[toBlocks()]] - code - apps/api/src/services/rag.service.ts
- [[tokenTail()]] - code - apps/api/src/services/rag.service.ts
- [[usage-pricing.ts]] - code - apps/api/src/config/usage-pricing.ts
- [[usage.service.ts]] - code - apps/api/src/services/usage.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Usage_Pricing__Chunk_Tools
SORT file.name ASC
```

## Connections to other communities
- 13 edges to [[_COMMUNITY_Content Controller]]
- 12 edges to [[_COMMUNITY_Env Config & Jobs]]
- 11 edges to [[_COMMUNITY_Section & Summary API]]
- 10 edges to [[_COMMUNITY_Community 48]]
- 10 edges to [[_COMMUNITY_Tenant Admin & Prisma]]
- 6 edges to [[_COMMUNITY_Community 65]]
- 4 edges to [[_COMMUNITY_Billing & Usage API]]
- 4 edges to [[_COMMUNITY_Community 67]]
- 4 edges to [[_COMMUNITY_Community 33]]
- 4 edges to [[_COMMUNITY_Community 55]]
- 3 edges to [[_COMMUNITY_Community 37]]
- 3 edges to [[_COMMUNITY_Community 57]]
- 2 edges to [[_COMMUNITY_Community 39]]
- 2 edges to [[_COMMUNITY_Community 51]]
- 2 edges to [[_COMMUNITY_Deck Prompt Builder]]
- 1 edge to [[_COMMUNITY_Admin Analytics & Subscriptions]]
- 1 edge to [[_COMMUNITY_Community 46]]
- 1 edge to [[_COMMUNITY_Slide Deck Types]]
- 1 edge to [[_COMMUNITY_Community 35]]

## Top bridge nodes
- [[rag.service.ts]] - degree 40, connects to 11 communities
- [[usage.service.ts]] - degree 22, connects to 8 communities
- [[buildRagContext()]] - degree 13, connects to 7 communities
- [[recordUsage()]] - degree 16, connects to 4 communities
- [[UsageContext]] - degree 9, connects to 4 communities