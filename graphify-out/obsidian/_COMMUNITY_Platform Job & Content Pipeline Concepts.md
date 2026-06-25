---
type: community
cohesion: 0.18
members: 11
---

# Platform Job & Content Pipeline Concepts

**Cohesion:** 0.18 - loosely connected
**Members:** 11 nodes

## Members
- [[API Routes Mounted at Root (no api prefix)]] - rationale - docs/PLATFORM.md
- [[Background Jobs (BullRedis)]] - concept - docs/FEATURES.md
- [[Content Pipeline & Job Model]] - concept - docs/PLATFORM.md
- [[Platform Guide]] - document - docs/PLATFORM.md
- [[QA with Playwright MCP]] - document - docs/QA.md
- [[Roles & Personas]] - concept - docs/PLATFORM.md
- [[Tech Stack & Infra]] - concept - docs/PLATFORM.md
- [[Three Apps Architecture]] - concept - docs/PLATFORM.md
- [[Two Audiences (B2C + B2B) One Codebase]] - rationale - docs/PLATFORM.md
- [[User Types Model]] - concept - docs/PLANS.md
- [[processContent Job (ingest→RAG)]] - concept - docs/PLATFORM.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Platform_Job__Content_Pipeline_Concepts
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Feature Catalog (AuthAdmini18n)]]
- 1 edge to [[_COMMUNITY_Deployment Infrastructure]]
- 1 edge to [[_COMMUNITY_Product Roadmap & Epics]]
- 1 edge to [[_COMMUNITY_Isolation Guard & Visual Direction]]

## Top bridge nodes
- [[Platform Guide]] - degree 9, connects to 2 communities
- [[Background Jobs (BullRedis)]] - degree 2, connects to 1 community
- [[User Types Model]] - degree 2, connects to 1 community
- [[Tech Stack & Infra]] - degree 2, connects to 1 community