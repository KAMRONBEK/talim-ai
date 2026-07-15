---
type: community
cohesion: 0.31
members: 10
---

# Learner API Controller

**Cohesion:** 0.31 - loosely connected
**Members:** 10 nodes

## Members
- [[getMaterials()]] - code - apps/api/src/controllers/learner.controller.ts
- [[getProgress()]] - code - apps/api/src/controllers/learner.controller.ts
- [[getSummary()]] - code - apps/api/src/controllers/learner.controller.ts
- [[learner.controller.ts]] - code - apps/api/src/controllers/learner.controller.ts
- [[listMessages()]] - code - apps/api/src/controllers/learner.controller.ts
- [[markMessageRead()]] - code - apps/api/src/controllers/learner.controller.ts
- [[readLocale()]] - code - apps/api/src/controllers/learner.controller.ts
- [[replyToMessage()]] - code - apps/api/src/controllers/learner.controller.ts
- [[requireTenant()_1]] - code - apps/api/src/controllers/learner.controller.ts
- [[unreadMessageCount()]] - code - apps/api/src/controllers/learner.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Learner_API_Controller
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_Content Controller (YouTubeOCR)]]
- 2 edges to [[_COMMUNITY_Billing & Quota Errors]]
- 2 edges to [[_COMMUNITY_Flashcards & Podcast Controllers]]
- 1 edge to [[_COMMUNITY_Env Config & Background Jobs]]
- 1 edge to [[_COMMUNITY_Audit & Content Management]]
- 1 edge to [[_COMMUNITY_Tenant Service & Assignments]]
- 1 edge to [[_COMMUNITY_Admin Content & Subscriptions]]
- 1 edge to [[_COMMUNITY_Assessment Controller]]

## Top bridge nodes
- [[learner.controller.ts]] - degree 19, connects to 8 communities
- [[markMessageRead()]] - degree 3, connects to 1 community
- [[readLocale()]] - degree 3, connects to 1 community
- [[replyToMessage()]] - degree 3, connects to 1 community