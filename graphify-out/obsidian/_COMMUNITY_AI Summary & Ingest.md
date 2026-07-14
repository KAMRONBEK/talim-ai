---
type: community
cohesion: 0.08
members: 46
---

# AI Summary & Ingest

**Cohesion:** 0.08 - loosely connected
**Members:** 46 nodes

## Members
- [[AiUsageContext]] - code - apps/api/src/services/ai.service.ts
- [[ChatMessageContent]] - code - apps/api/src/services/ai.service.ts
- [[ChatMessageInput]] - code - apps/api/src/services/ai.service.ts
- [[GeneratedSection]] - code - apps/api/src/services/section.service.ts
- [[GeneratedSubsection]] - code - apps/api/src/services/section.service.ts
- [[SECTION_TITLE_LOCALE_PROMPT]] - code - apps/api/src/services/section.service.ts
- [[SectionTitleInput]] - code - apps/api/src/services/section.service.ts
- [[TutorGraphIntent]] - code - apps/api/src/lib/tutor-graph-intent.ts
- [[TutorStreamEvent]] - code - apps/api/src/services/ai.service.ts
- [[TutorToolOptions]] - code - apps/api/src/services/ai.service.ts
- [[ai.service.ts]] - code - apps/api/src/services/ai.service.ts
- [[boundContextByTokens()]] - code - apps/api/src/services/rag.service.ts
- [[buildContext()]] - code - apps/api/src/services/slides.service.ts
- [[buildGraphIntentInstruction()]] - code - apps/api/src/services/ai.service.ts
- [[buildSectionUserPrompt()]] - code - apps/api/src/lib/section-prompt.ts
- [[buildSummaryMessages()]] - code - apps/api/src/controllers/summary.controller.ts
- [[buildSummaryUserPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[createDeepSeekChatCompletion()]] - code - apps/api/src/services/ai.service.ts
- [[createDeepSeekChatStream()]] - code - apps/api/src/services/ai.service.ts
- [[deepseek]] - code - apps/api/src/services/ai.service.ts
- [[formatSummary()]] - code - apps/api/src/controllers/summary.controller.ts
- [[generateChatCompletion()]] - code - apps/api/src/services/ai.service.ts
- [[generateContentSections()]] - code - apps/api/src/services/section.service.ts
- [[generateJsonCompletion()]] - code - apps/api/src/services/ai.service.ts
- [[generateSummary()]] - code - apps/api/src/controllers/summary.controller.ts
- [[generateSummaryText()]] - code - apps/api/src/controllers/summary.controller.ts
- [[getOrderedChunks()]] - code - apps/api/src/services/rag.service.ts
- [[getSectionBody()]] - code - apps/api/src/services/section.service.ts
- [[getSummary()_1]] - code - apps/api/src/controllers/summary.controller.ts
- [[getSummarySystemPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[ingest.service.ts]] - code - apps/api/src/services/ingest.service.ts
- [[ingestText()]] - code - apps/api/src/services/ingest.service.ts
- [[openai_1]] - code - apps/api/src/services/ai.service.ts
- [[recordCompletionUsage()]] - code - apps/api/src/services/ai.service.ts
- [[sanitizeSummaryOutput()]] - code - apps/api/src/lib/locale-prompts.ts
- [[scopeKey()_1]] - code - apps/api/src/controllers/summary.controller.ts
- [[section-prompt.ts]] - code - apps/api/src/lib/section-prompt.ts
- [[section.service.ts]] - code - apps/api/src/services/section.service.ts
- [[storeChunksWithEmbeddings()]] - code - apps/api/src/services/rag.service.ts
- [[streamSummary()]] - code - apps/api/src/controllers/summary.controller.ts
- [[summary.controller.ts]] - code - apps/api/src/controllers/summary.controller.ts
- [[summaryBodySchema]] - code - apps/api/src/controllers/summary.controller.ts
- [[summaryUserId()]] - code - apps/api/src/controllers/summary.controller.ts
- [[toTextOnlyMessages()]] - code - apps/api/src/services/ai.service.ts
- [[translateSectionTitles()]] - code - apps/api/src/services/section.service.ts
- [[withTutorToolInstructions()]] - code - apps/api/src/services/ai.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/AI_Summary__Ingest
SORT file.name ASC
```

## Connections to other communities
- 25 edges to [[_COMMUNITY_Content Access & Media API]]
- 20 edges to [[_COMMUNITY_Bull Jobs & Queues]]
- 10 edges to [[_COMMUNITY_RAG Retrieval]]
- 9 edges to [[_COMMUNITY_Learning Progress Service]]
- 8 edges to [[_COMMUNITY_Slide Deck Generation]]
- 6 edges to [[_COMMUNITY_Subscriptions & Quota]]
- 5 edges to [[_COMMUNITY_Tutor Visual Tools]]
- 5 edges to [[_COMMUNITY_Ingest & Usage Services]]
- 4 edges to [[_COMMUNITY_AI Prompt Builders]]
- 4 edges to [[_COMMUNITY_Embeddings Service]]
- 3 edges to [[_COMMUNITY_Shared Types & Locale]]
- 2 edges to [[_COMMUNITY_API Routing & Middleware]]
- 2 edges to [[_COMMUNITY_Content Stage & Limits]]
- 2 edges to [[_COMMUNITY_Question Generation Pipeline]]
- 2 edges to [[_COMMUNITY_Tutor Scope Classifier]]
- 2 edges to [[_COMMUNITY_Learner Submission & AI Judge]]
- 1 edge to [[_COMMUNITY_Chat Streaming API]]
- 1 edge to [[_COMMUNITY_Tutor Visual Blocks]]

## Top bridge nodes
- [[ai.service.ts]] - degree 37, connects to 11 communities
- [[summary.controller.ts]] - degree 42, connects to 9 communities
- [[section.service.ts]] - degree 23, connects to 6 communities
- [[generateJsonCompletion()]] - degree 11, connects to 6 communities
- [[streamSummary()]] - degree 12, connects to 3 communities