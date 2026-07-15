---
type: community
cohesion: 0.18
members: 11
---

# App Architecture Overview

**Cohesion:** 0.18 - loosely connected
**Members:** 11 nodes

## Members
- [[1. Stack & entry point]] - document - apps/api/CLAUDE.md
- [[2. Layout]] - document - apps/api/CLAUDE.md
- [[3. Route map]] - document - apps/api/CLAUDE.md
- [[4. Auth & middleware]] - document - apps/api/CLAUDE.md
- [[5. Data layer (Prisma)]] - document - apps/api/CLAUDE.md
- [[6. Multi-tenant isolation contract]] - document - apps/api/CLAUDE.md
- [[7. Background jobs & queues (Bull  Redis)]] - document - apps/api/CLAUDE.md
- [[8. Scripts]] - document - apps/api/CLAUDE.md
- [[9. Local gotchas]] - document - apps/api/CLAUDE.md
- [[CLAUDE_3]] - document - apps/api/CLAUDE.md
- [[appsapi — Express + Prisma backend]] - document - apps/api/CLAUDE.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/App_Architecture_Overview
SORT file.name ASC
```
