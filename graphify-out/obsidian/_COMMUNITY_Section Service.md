---
type: community
cohesion: 0.23
members: 15
---

# Section Service

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
TABLE source_file, type FROM #community/Section_Service
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_Media & Progress Controllers]]
- 6 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 4 edges to [[_COMMUNITY_Assessment & Tutor-Request Controllers]]
- 3 edges to [[_COMMUNITY_Content API Controller]]
- 3 edges to [[_COMMUNITY_Learning Coverage & Badges]]
- 2 edges to [[_COMMUNITY_Billing, Usage & Limits]]
- 2 edges to [[_COMMUNITY_Shared Types & Auth Stores]]
- 2 edges to [[_COMMUNITY_Content Grid & Learner Dashboard]]
- 2 edges to [[_COMMUNITY_API Middleware]]
- 2 edges to [[_COMMUNITY_AI Provider Service]]
- 2 edges to [[_COMMUNITY_Slide Deck Prompts]]
- 1 edge to [[_COMMUNITY_Admin Content & Audit]]
- 1 edge to [[_COMMUNITY_Locale AI Prompts]]
- 1 edge to [[_COMMUNITY_Background Jobs & Queues]]
- 1 edge to [[_COMMUNITY_AI Tutor Chat API]]

## Top bridge nodes
- [[section.service.ts]] - degree 23, connects to 9 communities
- [[section.controller.ts]] - degree 23, connects to 8 communities
- [[getSectionBody()]] - degree 9, connects to 5 communities
- [[getSection()]] - degree 8, connects to 2 communities
- [[listSections()]] - degree 5, connects to 2 communities