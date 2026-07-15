---
type: community
cohesion: 0.20
members: 10
---

# Content Ingestion Pipeline

**Cohesion:** 0.20 - loosely connected
**Members:** 10 nodes

## Members
- [[1. Content & AI]] - document - docs/FEATURES.md
- [[1.1 Upload PDFs  slides]] - document - docs/FEATURES.md
- [[1.2 YouTube import]] - document - docs/FEATURES.md
- [[1.3 Sectioning (hierarchical)]] - document - docs/FEATURES.md
- [[1.4 AI summaries]] - document - docs/FEATURES.md
- [[1.5 Podcasts (TTS + synced transcript)]] - document - docs/FEATURES.md
- [[1.6 Practice generator (unified questions + flashcards) & Elo-KT mastery]] - document - docs/FEATURES.md
- [[1.7 RAG AI tutor chat]] - document - docs/FEATURES.md
- [[1.8 AI tutor visuals (Manim)]] - document - docs/FEATURES.md
- [[1.9 Content viewing extras]] - document - docs/FEATURES.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Content_Ingestion_Pipeline
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Feature Catalog]]

## Top bridge nodes
- [[1. Content & AI]] - degree 10, connects to 1 community