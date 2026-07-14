---
type: community
cohesion: 1.00
members: 1
---

# QA Detail Catalog

**Cohesion:** 1.00 - tightly connected
**Members:** 1 nodes

## Members
- [[Minute-detail catalog (per-page checks - MCP call)]] - concept - docs/qa/human-qa-playbook.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/QA_Detail_Catalog
SORT file.name ASC
```
