---
type: community
cohesion: 0.47
members: 6
---

# CI Deploy Jobs

**Cohesion:** 0.47 - moderately connected
**Members:** 6 nodes

## Members
- [[GHCR registry (ghcr.iokamronbektalim-)]] - concept - .github/workflows/deploy.yml
- [[build job (build & push images to GHCR)]] - concept - .github/workflows/deploy.yml
- [[changes job (detect changed apps from diff)]] - concept - .github/workflows/deploy.yml
- [[deploy job (SSH VPS pull & restart)]] - concept - .github/workflows/deploy.yml
- [[deploy.yml (Deploy to VPS GitHub Actions)]] - document - .github/workflows/deploy.yml
- [[docker-compose.registry.yml (GHCR prebuilt images)]] - document - docker-compose.registry.yml

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/CI_Deploy_Jobs
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Project Guide & Isolation Concepts]]
- 1 edge to [[_COMMUNITY_Docker Compose Services]]

## Top bridge nodes
- [[deploy job (SSH VPS pull & restart)]] - degree 3, connects to 1 community
- [[docker-compose.registry.yml (GHCR prebuilt images)]] - degree 2, connects to 1 community