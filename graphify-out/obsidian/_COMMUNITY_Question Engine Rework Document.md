---
type: community
cohesion: 0.17
members: 12
---

# Question Engine Rework Document

**Cohesion:** 0.17 - loosely connected
**Members:** 12 nodes

## Members
- [[1. Unified generation parameters (B2C and B2B)]] - document - docs/plans/question-engine.md
- [[2. Generation pipeline (shared `appsapisrcservicesquestion-gen.service.ts`)]] - document - docs/plans/question-engine.md
- [[3. Unified grading (shared module `packagestypesgrading.ts`)]] - document - docs/plans/question-engine.md
- [[4. Mastery model — Elo-KT per (user, section)]] - document - docs/plans/question-engine.md
- [[5. UI changes]] - document - docs/plans/question-engine.md
- [[6. Migration & compat]] - document - docs/plans/question-engine.md
- [[7. v2 follow-ups (2026-07-12) — count reliability, flashcards-in-session, math rendering]] - document - docs/plans/question-engine.md
- [[8. UI polish round (2026-07-12, user feedback)]] - document - docs/plans/question-engine.md
- [[Question Engine Rework — Design]] - document - docs/plans/question-engine.md
- [[Rollout order]] - document - docs/plans/question-engine.md
- [[Why (product owner requirements)]] - document - docs/plans/question-engine.md
- [[question-engine]] - document - docs/plans/question-engine.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Question_Engine_Rework_Document
SORT file.name ASC
```
