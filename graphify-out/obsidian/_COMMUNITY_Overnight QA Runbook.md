---
type: community
cohesion: 0.22
members: 9
---

# Overnight QA Runbook

**Cohesion:** 0.22 - loosely connected
**Members:** 9 nodes

## Members
- [[0. Preflight & anti-stall (UNATTENDED — run FIRST, every session)]] - document - docs/qa/overnight-visual-qa.md
- [[1. Test accounts (create if missing; record creds in the report)]] - document - docs/qa/overnight-visual-qa.md
- [[HARD RULES (never break)_1]] - document - docs/qa/overnight-visual-qa.md
- [[Overnight DEEP QA Runbook — Talim AI]] - document - docs/qa/overnight-visual-qa.md
- [[overnight-visual-qa]] - document - docs/qa/overnight-visual-qa.md
- [[§A. Boot ritual (every session start; assume context was compacted)]] - document - docs/qa/overnight-visual-qa.md
- [[§B. Charter selection — the coverage frontier]] - document - docs/qa/overnight-visual-qa.md
- [[§C. Session loop (one charter; hard budget ≤35 browser actions or ~15 min)]] - document - docs/qa/overnight-visual-qa.md
- [[§D. Human-oracle rules (AI output + Uzbek quality)]] - document - docs/qa/overnight-visual-qa.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Overnight_QA_Runbook
SORT file.name ASC
```
