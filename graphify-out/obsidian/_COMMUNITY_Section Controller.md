---
type: community
cohesion: 0.23
members: 15
---

# Section Controller

**Cohesion:** 0.23 - loosely connected
**Members:** 15 nodes

## Members
- [[GeneratedSection]] - code - apps/api/src/services/section.service.ts
- [[GeneratedSubsection]] - code - apps/api/src/services/section.service.ts
- [[SECTION_TITLE_LOCALE_PROMPT]] - code - apps/api/src/services/section.service.ts
- [[SectionTitleInput]] - code - apps/api/src/services/section.service.ts
- [[buildSectionUserPrompt()]] - code - apps/api/src/lib/section-prompt.ts
- [[ensureSectionTitlesForLocale()]] - code - apps/api/src/services/section.service.ts
- [[formatSection()]] - code - apps/api/src/controllers/section.controller.ts
- [[getSection()]] - code - apps/api/src/controllers/section.controller.ts
- [[getSectionBody()]] - code - apps/api/src/services/section.service.ts
- [[listSections()]] - code - apps/api/src/controllers/section.controller.ts
- [[resolveSectionTitle()]] - code - apps/api/src/services/section.service.ts
- [[section-prompt.ts]] - code - apps/api/src/lib/section-prompt.ts
- [[section.controller.ts]] - code - apps/api/src/controllers/section.controller.ts
- [[section.service.ts]] - code - apps/api/src/services/section.service.ts
- [[translateSectionTitles()]] - code - apps/api/src/services/section.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Section_Controller
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_Content Media Controllers]]
- 5 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 3 edges to [[_COMMUNITY_Assessment Controller]]
- 3 edges to [[_COMMUNITY_API Routes & Middleware]]
- 3 edges to [[_COMMUNITY_AI Tutor Chat Controller]]
- 3 edges to [[_COMMUNITY_Learning Progress & Coverage]]
- 3 edges to [[_COMMUNITY_Job Event Fan-out & Media Jobs]]
- 2 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 2 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 2 edges to [[_COMMUNITY_Flashcards UI]]
- 2 edges to [[_COMMUNITY_Summary Controller]]
- 2 edges to [[_COMMUNITY_AI Provider Service]]
- 1 edge to [[_COMMUNITY_Admin Content & Audit Controllers]]
- 1 edge to [[_COMMUNITY_AI Prompt Builders]]
- 1 edge to [[_COMMUNITY_API Bootstrap & Background Jobs]]

## Top bridge nodes
- [[section.service.ts]] - degree 23, connects to 9 communities
- [[section.controller.ts]] - degree 23, connects to 8 communities
- [[getSectionBody()]] - degree 9, connects to 4 communities
- [[getSection()]] - degree 8, connects to 2 communities
- [[listSections()]] - degree 5, connects to 2 communities