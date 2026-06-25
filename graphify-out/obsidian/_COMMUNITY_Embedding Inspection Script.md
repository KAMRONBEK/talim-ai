---
type: community
cohesion: 0.24
members: 17
---

# Embedding Inspection Script

**Cohesion:** 0.24 - loosely connected
**Members:** 17 nodes

## Members
- [[UsageContext]] - code - apps/api/src/services/usage.service.ts
- [[captionAndStoreFigures()]] - code - apps/api/src/services/figure.service.ts
- [[clampToTokenLimit()]] - code - apps/api/src/services/embed.service.ts
- [[embed.service.ts]] - code - apps/api/src/services/embed.service.ts
- [[embeddingToSql()]] - code - apps/api/src/services/embed.service.ts
- [[figure.service.ts]] - code - apps/api/src/services/figure.service.ts
- [[generateEmbedding()]] - code - apps/api/src/services/embed.service.ts
- [[generateEmbeddings()]] - code - apps/api/src/services/embed.service.ts
- [[getChunkStats()]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[getEmbeddingStatusByIndex()]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[inspect-chunks.ts]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[main()_3]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[openai_2]] - code - apps/api/src/services/embed.service.ts
- [[parseArgs()_2]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[preview()]] - code - apps/api/src/scripts/inspect-chunks.ts
- [[recordEmbedUsage()]] - code - apps/api/src/services/embed.service.ts
- [[searchWithDistance()]] - code - apps/api/src/scripts/inspect-chunks.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Embedding_Inspection_Script
SORT file.name ASC
```

## Connections to other communities
- 15 edges to [[_COMMUNITY_AI Summary Generation]]
- 8 edges to [[_COMMUNITY_Usage Pricing & PDF Extraction]]
- 4 edges to [[_COMMUNITY_Env Config & Background Job Registration]]
- 4 edges to [[_COMMUNITY_Chat Controller & Sessions]]
- 3 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 3 edges to [[_COMMUNITY_Tenant Content Controller]]
- 1 edge to [[_COMMUNITY_TTS Normalization Service]]
- 1 edge to [[_COMMUNITY_YouTube Transcription Service]]

## Top bridge nodes
- [[figure.service.ts]] - degree 14, connects to 5 communities
- [[UsageContext]] - degree 8, connects to 4 communities
- [[embed.service.ts]] - degree 14, connects to 3 communities
- [[embeddingToSql()]] - degree 9, connects to 2 communities
- [[generateEmbedding()]] - degree 8, connects to 2 communities