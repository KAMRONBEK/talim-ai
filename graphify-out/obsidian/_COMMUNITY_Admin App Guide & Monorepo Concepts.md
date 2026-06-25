---
type: community
cohesion: 0.22
members: 9
---

# Admin App Guide & Monorepo Concepts

**Cohesion:** 0.22 - loosely connected
**Members:** 9 nodes

## Members
- [[@talimtypes shared package (build first)]] - concept - CLAUDE.md
- [[@talimui shared components]] - concept - CLAUDE.md
- [[Admin AuthGuard (ADMIN-only gating)]] - concept - apps/admin/CLAUDE.md
- [[Admin has no i18n (locale-prefix stripping)]] - rationale - apps/admin/CLAUDE.md
- [[Talim AI Monorepo (pnpm + Turborepo)]] - concept - CLAUDE.md
- [[adminPasswordNote plaintext support-lookup (sensitive)]] - rationale - apps/admin/CLAUDE.md
- [[appsadmin Guide (CLAUDE.md)]] - document - apps/admin/CLAUDE.md
- [[appsadmin — platform-admin panel (Talim Admin, port 3001)]] - concept - apps/admin/CLAUDE.md
- [[pnpm-workspace.yaml]] - document - pnpm-workspace.yaml

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_App_Guide__Monorepo_Concepts
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Project Guide & Isolation Concepts]]
- 2 edges to [[_COMMUNITY_API Backend Architecture]]
- 1 edge to [[_COMMUNITY_Web App & GAME Quiz Concepts]]
- 1 edge to [[_COMMUNITY_Docker Compose Services]]

## Top bridge nodes
- [[Talim AI Monorepo (pnpm + Turborepo)]] - degree 7, connects to 3 communities
- [[appsadmin — platform-admin panel (Talim Admin, port 3001)]] - degree 6, connects to 3 communities