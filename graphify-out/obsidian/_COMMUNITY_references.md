---
type: community
cohesion: 0.05
members: 49
---

# references

**Cohesion:** 0.05 - loosely connected
**Members:** 49 nodes

## Members
- [[BFSDFS Traversal Modes]] - concept - .claude/skills/graphify/references/query.md
- [[Cluster-Only Rerun (--cluster-only)]] - concept - .claude/skills/graphify/references/update.md
- [[Code-Only Change (skip semantic extraction)]] - rationale - .claude/skills/graphify/references/update.md
- [[Community Detection]] - concept - .claude/skills/graphify/SKILL.md
- [[Community Labeling]] - concept - .claude/skills/graphify/SKILL.md
- [[Confidence Score Rubric]] - rationale - .claude/skills/graphify/references/extraction-spec.md
- [[Constrained Query Expansion]] - rationale - .claude/skills/graphify/references/query.md
- [[Cross-Repo Graph Merge]] - concept - .claude/skills/graphify/references/github-and-merge.md
- [[Debounce (waits for file activity to stop)]] - rationale - .claude/skills/graphify/references/add-watch.md
- [[Extraction Cache]] - concept - .claude/skills/graphify/SKILL.md
- [[Extraction Subagent Prompt]] - document - .claude/skills/graphify/references/extraction-spec.md
- [[Fast Path (existing graph query)]] - rationale - .claude/skills/graphify/SKILL.md
- [[GRAPH_REPORT]] - concept - .claude/skills/graphify/SKILL.md
- [[Gemini Extraction Backend]] - concept - .claude/skills/graphify/SKILL.md
- [[GitHub Repo Clone]] - concept - .claude/skills/graphify/references/github-and-merge.md
- [[God Nodes]] - concept - .claude/skills/graphify/SKILL.md
- [[Graph Health Check]] - concept - .claude/skills/graphify/SKILL.md
- [[Graphify CLAUDE.md Integration]] - document - .claude/CLAUDE.md
- [[HTML Visualization]] - concept - .claude/skills/graphify/SKILL.md
- [[Hyperedge]] - concept - .claude/skills/graphify/references/extraction-spec.md
- [[Incremental Update (--update)]] - concept - .claude/skills/graphify/references/update.md
- [[Knowledge Graph]] - concept - .claude/skills/graphify/SKILL.md
- [[MCP Stdio Server]] - concept - .claude/skills/graphify/references/exports.md
- [[Native CLAUDE.md Integration]] - concept - .claude/skills/graphify/references/hooks.md
- [[NetworkX Inline Traversal Fallback]] - concept - .claude/skills/graphify/references/query.md
- [[Node ID Format Rule]] - rationale - .claude/skills/graphify/references/extraction-spec.md
- [[Obsidian Vault Export]] - concept - .claude/skills/graphify/SKILL.md
- [[Parallel Subagent Dispatch]] - rationale - .claude/skills/graphify/SKILL.md
- [[Post-Commit Auto-Rebuild Hook]] - concept - .claude/skills/graphify/references/hooks.md
- [[Semantic (LLM) Extraction]] - concept - .claude/skills/graphify/SKILL.md
- [[Semantic Similarity Edge]] - concept - .claude/skills/graphify/references/extraction-spec.md
- [[Shrink Guard (refuse to clobber larger graph)]] - rationale - .claude/skills/graphify/SKILL.md
- [[Structural (AST) Extraction]] - concept - .claude/skills/graphify/SKILL.md
- [[URL Ingestion (auto-detected types)]] - concept - .claude/skills/graphify/references/add-watch.md
- [[VideoAudio Transcription]] - concept - .claude/skills/graphify/references/transcribe.md
- [[Watch Mode (auto-rebuild on change)]] - concept - .claude/skills/graphify/references/add-watch.md
- [[Whisper Domain-Hint Prompt]] - rationale - .claude/skills/graphify/references/transcribe.md
- [[Wiki Export]] - concept - .claude/skills/graphify/references/exports.md
- [[Work Memory  LESSONS]] - concept - .claude/skills/graphify/references/query.md
- [[build_merge (replace-on-re-extract)]] - rationale - .claude/skills/graphify/references/update.md
- [[graph.json]] - concept - .claude/skills/graphify/SKILL.md
- [[graphify add URL]] - concept - .claude/skills/graphify/references/add-watch.md
- [[graphify explain]] - concept - .claude/skills/graphify/references/query.md
- [[graphify path]] - concept - .claude/skills/graphify/references/query.md
- [[graphify query]] - concept - .claude/skills/graphify/references/query.md
- [[graphify skill]] - document - .claude/skills/graphify/SKILL.md
- [[prune_sources (deleted-file pruning)]] - rationale - .claude/skills/graphify/references/update.md
- [[save-result Feedback Loop]] - concept - .claude/skills/graphify/references/query.md
- [[source_file Verbatim Rule]] - rationale - .claude/skills/graphify/references/extraction-spec.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/references
SORT file.name ASC
```
