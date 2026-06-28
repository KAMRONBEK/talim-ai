---
type: community
cohesion: 0.18
members: 15
---

# workflows

**Cohesion:** 0.18 - loosely connected
**Members:** 15 nodes

## Members
- [[CI runner builds images; 2GB VPS only pulls]] - rationale - .github/workflows/deploy.yml
- [[Changed-app fan-out rule (shared dep rebuilds all)]] - rationale - .github/workflows/deploy.yml
- [[Compose service admin (Next.js platform-admin panel)]] - concept - docker-compose.yml
- [[Compose service api (Express + Prisma + Bull)]] - concept - docker-compose.yml
- [[Compose service db (pgvectorpgvectorpg16)]] - concept - docker-compose.yml
- [[Compose service nginx (reverse proxy + TLS)]] - concept - docker-compose.yml
- [[Compose service redis (redis7-alpine)]] - concept - docker-compose.yml
- [[Compose service web (Next.js learnertenant app)]] - concept - docker-compose.yml
- [[Deploy Build & push images job]] - concept - .github/workflows/deploy.yml
- [[Deploy Deploy to VPS job]] - concept - .github/workflows/deploy.yml
- [[Deploy Detect changed apps job]] - concept - .github/workflows/deploy.yml
- [[Doppler-injected Compose secrets]] - rationale - docker-compose.yml
- [[GHCR image registry (ghcr.iokamronbektalim-)]] - concept - .github/workflows/deploy.yml
- [[NEXT_PUBLIC_API_URL inlined into webadmin at build]] - rationale - .github/workflows/deploy.yml
- [[Pull latest for app tier only; dbredisnginx pinned]] - rationale - .github/workflows/deploy.yml

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/workflows
SORT file.name ASC
```
