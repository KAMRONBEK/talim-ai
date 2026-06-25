---
type: community
cohesion: 0.31
members: 11
---

# TTS Normalization Service

**Cohesion:** 0.31 - loosely connected
**Members:** 11 nodes

## Members
- [[AppLocale]] - code - packages/types/locale.ts
- [[EN_ACRONYMS]] - code - apps/api/src/lib/tts-normalize.ts
- [[VOICE_BY_LOCALE]] - code - apps/api/src/services/tts.service.ts
- [[normalizeEnglish()]] - code - apps/api/src/lib/tts-normalize.ts
- [[normalizeScriptForTts()]] - code - apps/api/src/lib/tts-normalize.ts
- [[openai_3]] - code - apps/api/src/services/tts.service.ts
- [[splitScriptIntoChunks()]] - code - apps/api/src/lib/tts-normalize.ts
- [[synthesizeChunk()]] - code - apps/api/src/services/tts.service.ts
- [[synthesizeSpeech()]] - code - apps/api/src/services/tts.service.ts
- [[tts-normalize.ts]] - code - apps/api/src/lib/tts-normalize.ts
- [[tts.service.ts]] - code - apps/api/src/services/tts.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/TTS_Normalization_Service
SORT file.name ASC
```

## Connections to other communities
- 6 edges to [[_COMMUNITY_Content Status & Processing UI]]
- 5 edges to [[_COMMUNITY_Shared TypeScript Types (@talimtypes)]]
- 4 edges to [[_COMMUNITY_Env Config & Background Job Registration]]
- 3 edges to [[_COMMUNITY_AI Summary Generation]]
- 3 edges to [[_COMMUNITY_Usage Pricing & PDF Extraction]]
- 2 edges to [[_COMMUNITY_Podcast & Progress Controllers]]
- 2 edges to [[_COMMUNITY_AI Slide-Deck Prompting]]
- 2 edges to [[_COMMUNITY_Tutor Scope Classification]]
- 2 edges to [[_COMMUNITY_Recent Content Grid UI]]
- 2 edges to [[_COMMUNITY_Quiz Page & Hooks]]
- 2 edges to [[_COMMUNITY_Web API Client & Locale]]
- 1 edge to [[_COMMUNITY_Chat Controller & Sessions]]
- 1 edge to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 1 edge to [[_COMMUNITY_Locale-Aware AI Prompts]]
- 1 edge to [[_COMMUNITY_Embedding Inspection Script]]
- 1 edge to [[_COMMUNITY_Login Page & Sheet UI]]
- 1 edge to [[_COMMUNITY_Tutor Chat Message Components]]
- 1 edge to [[_COMMUNITY_API Endpoints Map & Deck Player]]
- 1 edge to [[_COMMUNITY_Auth Store (Zustand)]]
- 1 edge to [[_COMMUNITY_Admin Content & Users UI]]

## Top bridge nodes
- [[AppLocale]] - degree 34, connects to 17 communities
- [[tts.service.ts]] - degree 15, connects to 4 communities
- [[tts-normalize.ts]] - degree 7, connects to 1 community
- [[synthesizeSpeech()]] - degree 5, connects to 1 community
- [[synthesizeChunk()]] - degree 3, connects to 1 community