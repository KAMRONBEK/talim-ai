---
type: community
cohesion: 0.40
members: 5
---

# Graphify URL Ingestion

**Cohesion:** 0.40 - moderately connected
**Members:** 5 nodes

## Members
- [[Cluster-Only Rerun (--cluster-only)]] - concept - .claude/skills/graphify/references/update.md
- [[Incremental Update (--update)]] - concept - .claude/skills/graphify/references/update.md
- [[URL Ingestion (auto-detected types)]] - concept - .claude/skills/graphify/references/add-watch.md
- [[graphify add URL]] - concept - .claude/skills/graphify/references/add-watch.md
- [[prune_sources (deleted-file pruning)]] - rationale - .claude/skills/graphify/references/update.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Graphify_URL_Ingestion
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Knowledge Graph Extraction]]
- 1 edge to [[_COMMUNITY_Graphify Development Tools]]

## Top bridge nodes
- [[Incremental Update (--update)]] - degree 5, connects to 2 communities