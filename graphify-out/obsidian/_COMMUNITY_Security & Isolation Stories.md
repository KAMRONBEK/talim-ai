---
type: community
cohesion: 0.25
members: 8
---

# Security & Isolation Stories

**Cohesion:** 0.25 - loosely connected
**Members:** 8 nodes

## Members
- [[Area Security, multi-tenant isolation matrix, resilience, jobs, quota, data-lifecycle]] - document - docs/qa/user-stories-expansion.md
- [[US-XCUT-04 Multi-tenant isolation matrix — every content sub-resource + assessment endpoint]] - document - docs/qa/user-stories-expansion.md
- [[US-XCUT-05 Resilience — SSRhydration, stale react-query cache, slowoffline network, double-submit, concurrency]] - document - docs/qa/user-stories-expansion.md
- [[US-XCUT-09 Auth boundary — JWT tamperforgeexpire, deleteddeactivated user, legacy token, role escalation]] - document - docs/qa/user-stories-expansion.md
- [[US-XCUT-10 Network boundary — CORS allow-list, rate limits, payload caps, helmet]] - document - docs/qa/user-stories-expansion.md
- [[US-XCUT-11 Background jobs — lifecycle, failure, retry, orphans, partial generation, Redis down]] - document - docs/qa/user-stories-expansion.md
- [[US-XCUT-12 Quota matrix — every feature × plan × role → correct 402413 contract + role-aware upgrade]] - document - docs/qa/user-stories-expansion.md
- [[US-XCUT-13 Data lifecycle & cascade — delete content  student  tenant; deactivate  reactivate]] - document - docs/qa/user-stories-expansion.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Security__Isolation_Stories
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Cross-Cutting Quality]]

## Top bridge nodes
- [[Area Security, multi-tenant isolation matrix, resilience, jobs, quota, data-lifecycle]] - degree 8, connects to 1 community