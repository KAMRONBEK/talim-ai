---
type: community
cohesion: 0.22
members: 9
---

# docs · User Types Model

**Cohesion:** 0.22 - loosely connected
**Members:** 9 nodes

## Members
- [[API Routes Mounted at Root (no api prefix)]] - rationale - docs/PLATFORM.md
- [[End-to-end Journeys]] - concept - docs/PLATFORM.md
- [[Multi-tenancy & Data Isolation]] - rationale - docs/PLATFORM.md
- [[Platform Guide]] - document - docs/PLATFORM.md
- [[QA with Playwright MCP]] - document - docs/QA.md
- [[Roles & Personas]] - concept - docs/PLATFORM.md
- [[Three Apps Architecture]] - concept - docs/PLATFORM.md
- [[Two Audiences (B2C + B2B) One Codebase]] - rationale - docs/PLATFORM.md
- [[User Types Model]] - concept - docs/PLANS.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/docs__User_Types_Model
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_plans]]
- 1 edge to [[_COMMUNITY_docs · Background jobs (Bull  Redis)]]
- 1 edge to [[_COMMUNITY_docs]]
- 1 edge to [[_COMMUNITY_docs · Admin Subdomain DNS + SSL]]

## Top bridge nodes
- [[Platform Guide]] - degree 9, connects to 3 communities
- [[User Types Model]] - degree 2, connects to 1 community