---
type: community
cohesion: 0.18
members: 13
---

# API Backend Architecture

**Cohesion:** 0.18 - loosely connected
**Members:** 13 nodes

## Members
- [[API bootstrap() (helmetCORSjobslisten)]] - concept - apps/api/CLAUDE.md
- [[API middleware (authtenantquotarate-limituploaderror)]] - concept - apps/api/CLAUDE.md
- [[Admin data layer (libapi.ts Axios + hooksuseAdmin.ts + TanStack Query)]] - concept - apps/admin/CLAUDE.md
- [[Barrel-split module pattern]] - concept - CLAUDE.md
- [[Bull background jobs (processContentgenerateQuizgeneratePodcastrenderManim)]] - concept - README.md
- [[Prisma schema (Postgres + pgvector models)]] - concept - apps/api/CLAUDE.md
- [[Single API process is also the Bull worker]] - rationale - apps/api/CLAUDE.md
- [[Use dbmigratedeploy locally (checksum-drift rationale)]] - rationale - CLAUDE.md
- [[Web data fetching (libapi.ts axios + react-query hooks)]] - concept - apps/web/CLAUDE.md
- [[appsapi Guide (CLAUDE.md)]] - document - apps/api/CLAUDE.md
- [[appsapi — Express+Prisma+Bull backend (port 4000)]] - concept - apps/api/CLAUDE.md
- [[pgvector RAG raw-query embeddings (rag.service.ts)]] - concept - apps/api/CLAUDE.md
- [[prisma generate before typecheckbuild (stale-client rationale)]] - rationale - CLAUDE.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/API_Backend_Architecture
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Admin App Guide & Monorepo Concepts]]
- 1 edge to [[_COMMUNITY_README & API Route Map]]
- 1 edge to [[_COMMUNITY_Project Guide & Isolation Concepts]]
- 1 edge to [[_COMMUNITY_Docker Compose Services]]
- 1 edge to [[_COMMUNITY_Web App & GAME Quiz Concepts]]

## Top bridge nodes
- [[appsapi — Express+Prisma+Bull backend (port 4000)]] - degree 12, connects to 3 communities
- [[Admin data layer (libapi.ts Axios + hooksuseAdmin.ts + TanStack Query)]] - degree 3, connects to 1 community
- [[Bull background jobs (processContentgenerateQuizgeneratePodcastrenderManim)]] - degree 3, connects to 1 community
- [[Web data fetching (libapi.ts axios + react-query hooks)]] - degree 3, connects to 1 community