---
type: community
cohesion: 0.50
members: 8
---

# Docker Compose Services

**Cohesion:** 0.50 - moderately connected
**Members:** 8 nodes

## Members
- [[admin service (appsadminDockerfile)]] - concept - docker-compose.yml
- [[api service (appsapiDockerfile)]] - concept - docker-compose.yml
- [[db service (pgvectorpgvectorpg16)]] - concept - docker-compose.yml
- [[docker-compose.prod.yml (production override)]] - document - docker-compose.prod.yml
- [[docker-compose.yml (base stack)]] - document - docker-compose.yml
- [[nginx service (nginxalpine)]] - concept - docker-compose.yml
- [[redis service (redis7-alpine)]] - concept - docker-compose.yml
- [[web service (appswebDockerfile)]] - concept - docker-compose.yml

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Docker_Compose_Services
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Admin App Guide & Monorepo Concepts]]
- 1 edge to [[_COMMUNITY_API Backend Architecture]]
- 1 edge to [[_COMMUNITY_Web App & GAME Quiz Concepts]]
- 1 edge to [[_COMMUNITY_CI Deploy Jobs]]

## Top bridge nodes
- [[docker-compose.yml (base stack)]] - degree 8, connects to 1 community
- [[api service (appsapiDockerfile)]] - degree 7, connects to 1 community
- [[admin service (appsadminDockerfile)]] - degree 4, connects to 1 community
- [[web service (appswebDockerfile)]] - degree 4, connects to 1 community