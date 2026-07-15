---
type: community
cohesion: 0.20
members: 10
---

# Knip Config (Dead Code)

**Cohesion:** 0.20 - loosely connected
**Members:** 10 nodes

## Members
- [[$schema_1]] - code - knip.json
- [[appsadmin]] - code - knip.json
- [[appsapi]] - code - knip.json
- [[appsweb]] - code - knip.json
- [[entry]] - code - knip.json
- [[ignoreBinaries]] - code - knip.json
- [[ignoreDependencies_1]] - code - knip.json
- [[ignoreDependencies]] - code - knip.json
- [[knip.json]] - code - knip.json
- [[workspaces]] - code - knip.json

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Knip_Config_Dead_Code
SORT file.name ASC
```
