---
type: community
cohesion: 0.13
members: 15
---

# Graphify Extraction Pipeline

**Cohesion:** 0.13 - loosely connected
**Members:** 15 nodes

## Members
- [[Part A - Structural extraction for code files]] - document - .claude/skills/graphify/SKILL.md
- [[Part B - Semantic extraction (parallel subagents)]] - document - .claude/skills/graphify/SKILL.md
- [[Part C - Merge AST + semantic into final extraction]] - document - .claude/skills/graphify/SKILL.md
- [[Step 0 - GitHub repos and multi-path merge (only if a URL or several paths)]] - document - .claude/skills/graphify/SKILL.md
- [[Step 1 - Ensure graphify is installed]] - document - .claude/skills/graphify/SKILL.md
- [[Step 2 - Detect files]] - document - .claude/skills/graphify/SKILL.md
- [[Step 2.5 - Video and audio (only if video files detected)]] - document - .claude/skills/graphify/SKILL.md
- [[Step 3 - Extract entities and relationships]] - document - .claude/skills/graphify/SKILL.md
- [[Step 4 - Build graph, cluster, analyze, generate outputs]] - document - .claude/skills/graphify/SKILL.md
- [[Step 4.5 - Graph health check (read-only integrity gate)]] - document - .claude/skills/graphify/SKILL.md
- [[Step 5 - Label communities]] - document - .claude/skills/graphify/SKILL.md
- [[Step 6 - Generate Obsidian vault (opt-in) + HTML]] - document - .claude/skills/graphify/SKILL.md
- [[Step 9 - Save manifest, update cost tracker, clean up, and report]] - document - .claude/skills/graphify/SKILL.md
- [[Steps 6b-8 - Wiki, Neo4j, FalkorDB, SVG, GraphML, MCP, benchmark (only on their flags)]] - document - .claude/skills/graphify/SKILL.md
- [[What You Must Do When Invoked]] - document - .claude/skills/graphify/SKILL.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Graphify_Extraction_Pipeline
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Graphify Tool Features]]

## Top bridge nodes
- [[What You Must Do When Invoked]] - degree 12, connects to 1 community