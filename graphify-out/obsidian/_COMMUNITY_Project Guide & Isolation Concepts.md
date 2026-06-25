---
type: community
cohesion: 0.20
members: 11
---

# Project Guide & Isolation Concepts

**Cohesion:** 0.20 - loosely connected
**Members:** 11 nodes

## Members
- [[Admin routes (dashboardtutor-requestsuserstenantscontentgeneratedsubscriptionsusageaudit)]] - concept - apps/admin/CLAUDE.md
- [[Become-a-Tutor  TutorRequest flow]] - concept - CLAUDE.md
- [[Doppler secrets management (devprd)]] - concept - CLAUDE.md
- [[Manual Activation  No Payment Integration]] - rationale - CLAUDE.md
- [[Multi-tenant Isolation Contract]] - rationale - CLAUDE.md
- [[Role-based post-login routing (getPostLoginPath  RoleGuard)]] - concept - apps/web/CLAUDE.md
- [[Talim AI Project Guide (CLAUDE.md)]] - document - CLAUDE.md
- [[TenantMembership.active = live student access switch]] - rationale - apps/api/CLAUDE.md
- [[UserRole product model (ADMINTENANT_OWNERTENANT_LEARNERINDIVIDUAL)]] - concept - CLAUDE.md
- [[contentAccess.service.ts (isolation guard)]] - concept - apps/api/CLAUDE.md
- [[doppler.yaml (project talim-ai  config dev)]] - document - doppler.yaml

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Project_Guide__Isolation_Concepts
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Web App & GAME Quiz Concepts]]
- 2 edges to [[_COMMUNITY_Admin App Guide & Monorepo Concepts]]
- 1 edge to [[_COMMUNITY_CI Deploy Jobs]]
- 1 edge to [[_COMMUNITY_API Backend Architecture]]

## Top bridge nodes
- [[Talim AI Project Guide (CLAUDE.md)]] - degree 6, connects to 2 communities
- [[contentAccess.service.ts (isolation guard)]] - degree 3, connects to 1 community
- [[Doppler secrets management (devprd)]] - degree 3, connects to 1 community
- [[Admin routes (dashboardtutor-requestsuserstenantscontentgeneratedsubscriptionsusageaudit)]] - degree 2, connects to 1 community
- [[Role-based post-login routing (getPostLoginPath  RoleGuard)]] - degree 2, connects to 1 community