---
type: community
cohesion: 0.20
members: 11
---

# Knowledge Graph Extraction

**Cohesion:** 0.20 - loosely connected
**Members:** 11 nodes

## Members
- [[Confidence Score Rubric]] - rationale - .claude/skills/graphify/references/extraction-spec.md
- [[Extraction Cache]] - concept - .claude/skills/graphify/SKILL.md
- [[Extraction Subagent Prompt]] - document - .claude/skills/graphify/references/extraction-spec.md
- [[Gemini Extraction Backend]] - concept - .claude/skills/graphify/SKILL.md
- [[Hyperedge]] - concept - .claude/skills/graphify/references/extraction-spec.md
- [[Node ID Format Rule]] - rationale - .claude/skills/graphify/references/extraction-spec.md
- [[Parallel Subagent Dispatch]] - rationale - .claude/skills/graphify/SKILL.md
- [[Semantic (LLM) Extraction]] - concept - .claude/skills/graphify/SKILL.md
- [[Semantic Similarity Edge]] - concept - .claude/skills/graphify/references/extraction-spec.md
- [[build_merge (replace-on-re-extract)]] - rationale - .claude/skills/graphify/references/update.md
- [[source_file Verbatim Rule]] - rationale - .claude/skills/graphify/references/extraction-spec.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Knowledge_Graph_Extraction
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Graphify URL Ingestion]]

## Top bridge nodes
- [[build_merge (replace-on-re-extract)]] - degree 3, connects to 1 community