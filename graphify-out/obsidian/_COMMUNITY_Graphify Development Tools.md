---
type: community
cohesion: 0.25
members: 8
---

# Graphify Development Tools

**Cohesion:** 0.25 - loosely connected
**Members:** 8 nodes

## Members
- [[Code-Only Change (skip semantic extraction)]] - rationale - .claude/skills/graphify/references/update.md
- [[Debounce (waits for file activity to stop)]] - rationale - .claude/skills/graphify/references/add-watch.md
- [[Post-Commit Auto-Rebuild Hook]] - concept - .claude/skills/graphify/references/hooks.md
- [[VideoAudio Transcription]] - concept - .claude/skills/graphify/references/transcribe.md
- [[Watch Mode (auto-rebuild on change)]] - concept - .claude/skills/graphify/references/add-watch.md
- [[Whisper Domain-Hint Prompt]] - rationale - .claude/skills/graphify/references/transcribe.md
- [[Work Memory  LESSONS]] - concept - .claude/skills/graphify/references/query.md
- [[save-result Feedback Loop]] - concept - .claude/skills/graphify/references/query.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Graphify_Development_Tools
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Graphify Tool Features]]
- 1 edge to [[_COMMUNITY_Graph Query & Traversal]]
- 1 edge to [[_COMMUNITY_Graphify URL Ingestion]]

## Top bridge nodes
- [[Code-Only Change (skip semantic extraction)]] - degree 4, connects to 1 community
- [[Post-Commit Auto-Rebuild Hook]] - degree 3, connects to 1 community
- [[VideoAudio Transcription]] - degree 3, connects to 1 community
- [[save-result Feedback Loop]] - degree 2, connects to 1 community