---
type: community
cohesion: 0.25
members: 8
---

# docs · Background jobs (Bull / Redis)

**Cohesion:** 0.25 - loosely connected
**Members:** 8 nodes

## Members
- [[Background jobs (Bull  Redis)]] - concept - docs/FEATURES.md
- [[Content & generated media (admin)]] - concept - docs/FEATURES.md
- [[Content Pipeline & Job Model]] - concept - docs/PLATFORM.md
- [[Content viewing extras (download, OCR region, transcript, history)]] - concept - docs/FEATURES.md
- [[Materials + assignment]] - concept - docs/FEATURES.md
- [[Podcasts (TTS)]] - concept - docs/FEATURES.md
- [[Upload PDFs  slides]] - concept - docs/FEATURES.md
- [[processContent Job (ingest→RAG)]] - concept - docs/PLATFORM.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/docs__Background_jobs_Bull_/_Redis
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_docs · Assignment, attempts & max attempts]]
- 1 edge to [[_COMMUNITY_plans · Internationalization (uz  en  ru)]]
- 1 edge to [[_COMMUNITY_docs · User Types Model]]

## Top bridge nodes
- [[Background jobs (Bull  Redis)]] - degree 6, connects to 2 communities
- [[Content Pipeline & Job Model]] - degree 2, connects to 1 community