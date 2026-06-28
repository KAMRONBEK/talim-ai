---
type: community
cohesion: 0.26
members: 16
---

# src controllers · content.controller.ts

**Cohesion:** 0.26 - loosely connected
**Members:** 16 nodes

## Members
- [[AuthPayload]] - code - apps/api/src/middleware/auth.middleware.ts
- [[assertCanMutateContent()]] - code - apps/api/src/services/contentAccess.service.ts
- [[assertIndividualContentRoute()]] - code - apps/api/src/services/contentAccess.service.ts
- [[buildContentListWhere()]] - code - apps/api/src/services/contentAccess.service.ts
- [[content.controller.ts_1]] - code - apps/api/src/controllers/content.controller.ts
- [[contentAccess.service.ts]] - code - apps/api/src/services/contentAccess.service.ts
- [[createYoutubeContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[deleteContent()_1]] - code - apps/api/src/controllers/content.controller.ts
- [[formatContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[getAssignedContentIds()]] - code - apps/api/src/services/contentAccess.service.ts
- [[getContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[getFileLimitsForUser()]] - code - apps/api/src/services/subscription/user.ts
- [[listContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[reparseContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[retryContent()]] - code - apps/api/src/controllers/content.controller.ts
- [[uploadContent()]] - code - apps/api/src/controllers/content.controller.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/src_controllers__contentcontrollerts
SORT file.name ASC
```

## Connections to other communities
- 22 edges to [[_COMMUNITY_src controllers]]
- 13 edges to [[_COMMUNITY_subscription]]
- 10 edges to [[_COMMUNITY_src services · env.ts]]
- 10 edges to [[_COMMUNITY_controllers admin]]
- 10 edges to [[_COMMUNITY_src controllers · sendContentFile()]]
- 6 edges to [[_COMMUNITY_src routes]]
- 4 edges to [[_COMMUNITY_src services · usage-pricing.ts]]
- 4 edges to [[_COMMUNITY_src services · slides.controller.ts]]
- 3 edges to [[_COMMUNITY_src services]]
- 1 edge to [[_COMMUNITY_services tenant]]
- 1 edge to [[_COMMUNITY_src controllers · chat.controller.ts]]
- 1 edge to [[_COMMUNITY_src jobs]]
- 1 edge to [[_COMMUNITY_src controllers · quiz.controller.ts]]
- 1 edge to [[_COMMUNITY_src controllers · summary.controller.ts]]

## Top bridge nodes
- [[content.controller.ts_1]] - degree 55, connects to 10 communities
- [[contentAccess.service.ts]] - degree 28, connects to 10 communities
- [[reparseContent()]] - degree 10, connects to 5 communities
- [[retryContent()]] - degree 6, connects to 2 communities
- [[uploadContent()]] - degree 6, connects to 2 communities