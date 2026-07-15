---
type: community
cohesion: 0.70
members: 5
---

# VPS Watchdog Script

**Cohesion:** 0.70 - tightly connected
**Members:** 5 nodes

## Members
- [[alert()]] - code - scripts/vps-watchdog.sh
- [[log()_1]] - code - scripts/vps-watchdog.sh
- [[ts()]] - code - scripts/vps-watchdog.sh
- [[vps-watchdog.sh]] - code - scripts/vps-watchdog.sh
- [[vps-watchdog.sh script]] - code - scripts/vps-watchdog.sh

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/VPS_Watchdog_Script
SORT file.name ASC
```
