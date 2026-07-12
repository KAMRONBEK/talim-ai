---
type: community
cohesion: 0.19
members: 13
---

# Platform Docs & Deploy

**Cohesion:** 0.19 - loosely connected
**Members:** 13 nodes

## Members
- [[Build & Push GHCR Job]] - code - .github/workflows/deploy.yml
- [[Deploy to VPS GitHub Actions Workflow]] - code - .github/workflows/deploy.yml
- [[Detect Changed Apps Job]] - code - .github/workflows/deploy.yml
- [[Live Multi-Tenant Isolation Matrix (runs 48)]] - concept - docs/qa/visual-qa-report.md
- [[Manual PaymentActivation Model]] - concept - docs/PLATFORM.md
- [[Multi-Tenant Isolation Guard (contentAccess.service)]] - concept - docs/FEATURES.md
- [[Production Deployment Topology (nginx + Docker + GHCR)]] - concept - docs/PLATFORM.md
- [[Role Adaptations (server-side security)]] - rationale - docs/plans/youlearn-redesign.md
- [[Talim AI Platform]] - concept - docs/PLATFORM.md
- [[Talim AI Platform Guide]] - document - docs/PLATFORM.md
- [[Three-app Monorepo Architecture]] - concept - docs/PLATFORM.md
- [[UserRole Model (ADMIN  TENANT_OWNER  TENANT_LEARNER  INDIVIDUAL)]] - concept - docs/PLATFORM.md
- [[VPS Pull & Restart Job]] - code - .github/workflows/deploy.yml

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Platform_Docs__Deploy
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Features Docs]]
- 1 edge to [[_COMMUNITY_Community 86]]
- 1 edge to [[_COMMUNITY_Visual QA Report]]

## Top bridge nodes
- [[Talim AI Platform Guide]] - degree 8, connects to 1 community
- [[Multi-Tenant Isolation Guard (contentAccess.service)]] - degree 4, connects to 1 community
- [[Role Adaptations (server-side security)]] - degree 2, connects to 1 community
- [[Live Multi-Tenant Isolation Matrix (runs 48)]] - degree 2, connects to 1 community