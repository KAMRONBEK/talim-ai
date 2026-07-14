---
type: community
cohesion: 0.27
members: 10
---

# Platform Guide Docs

**Cohesion:** 0.27 - loosely connected
**Members:** 10 nodes

## Members
- [[Build & Push GHCR Job]] - code - .github/workflows/deploy.yml
- [[Deploy to VPS GitHub Actions Workflow]] - code - .github/workflows/deploy.yml
- [[Detect Changed Apps Job]] - code - .github/workflows/deploy.yml
- [[Manual PaymentActivation Model]] - concept - docs/PLATFORM.md
- [[Production Deployment Topology (nginx + Docker + GHCR)]] - concept - docs/PLATFORM.md
- [[Talim AI Platform]] - concept - docs/PLATFORM.md
- [[Talim AI Platform Guide]] - document - docs/PLATFORM.md
- [[Three-app Monorepo Architecture]] - concept - docs/PLATFORM.md
- [[UserRole Model (ADMIN  TENANT_OWNER  TENANT_LEARNER  INDIVIDUAL)]] - concept - docs/PLATFORM.md
- [[VPS Pull & Restart Job]] - code - .github/workflows/deploy.yml

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Platform_Guide_Docs
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Feature Catalog Docs]]
- 1 edge to [[_COMMUNITY_AI Tutor & RAG Plans]]

## Top bridge nodes
- [[Talim AI Platform Guide]] - degree 8, connects to 2 communities