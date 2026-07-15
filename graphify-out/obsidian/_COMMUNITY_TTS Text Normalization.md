---
type: community
cohesion: 0.10
members: 34
---

# TTS Text Normalization

**Cohesion:** 0.10 - loosely connected
**Members:** 34 nodes

## Members
- [[AZURE_LANG]] - code - apps/api/src/services/tts.service.ts
- [[AZURE_VOICES_BY_LOCALE]] - code - apps/api/src/services/tts.service.ts
- [[CYR_VOWELS]] - code - apps/api/src/lib/tts-normalize.ts
- [[EN_ACRONYMS]] - code - apps/api/src/lib/tts-normalize.ts
- [[MOD_APOSTROPHE]] - code - apps/api/src/lib/tts-normalize.ts
- [[MOD_TURNED_COMMA]] - code - apps/api/src/lib/tts-normalize.ts
- [[NBSP_RE]] - code - apps/api/src/lib/tts-normalize.ts
- [[OPENAI_VOICES_BY_LOCALE]] - code - apps/api/src/services/tts.service.ts
- [[OpenAiVoice]] - code - apps/api/src/services/tts.service.ts
- [[Speaker]] - code - apps/api/src/services/tts.service.ts
- [[UZ_CYR_TO_LAT]] - code - apps/api/src/lib/tts-normalize.ts
- [[ZERO_WIDTH_RE]] - code - apps/api/src/lib/tts-normalize.ts
- [[azureConfigured]] - code - apps/api/src/services/tts.service.ts
- [[azurePostWithRetry()]] - code - apps/api/src/services/tts.service.ts
- [[cleanupCommon()]] - code - apps/api/src/lib/tts-normalize.ts
- [[escapeXml()]] - code - apps/api/src/services/tts.service.ts
- [[fixUzbekApostrophes()]] - code - apps/api/src/lib/tts-normalize.ts
- [[isUpperLetter()]] - code - apps/api/src/lib/tts-normalize.ts
- [[mapLimit()]] - code - apps/api/src/services/tts.service.ts
- [[normalizeEnglish()]] - code - apps/api/src/lib/tts-normalize.ts
- [[normalizeScriptForTts()]] - code - apps/api/src/lib/tts-normalize.ts
- [[openai_3]] - code - apps/api/src/services/tts.service.ts
- [[recordTtsUsage()]] - code - apps/api/src/services/tts.service.ts
- [[sanitizeForXml()]] - code - apps/api/src/services/tts.service.ts
- [[sleep()]] - code - apps/api/src/services/tts.service.ts
- [[splitScriptIntoChunks()]] - code - apps/api/src/lib/tts-normalize.ts
- [[synthesizeChunk()]] - code - apps/api/src/services/tts.service.ts
- [[synthesizeChunkAzure()]] - code - apps/api/src/services/tts.service.ts
- [[synthesizeChunkOpenai()]] - code - apps/api/src/services/tts.service.ts
- [[synthesizeDialogueWithSegments()]] - code - apps/api/src/services/tts.service.ts
- [[synthesizeSpeech()]] - code - apps/api/src/services/tts.service.ts
- [[transliterateUzbek()]] - code - apps/api/src/lib/tts-normalize.ts
- [[tts-normalize.ts]] - code - apps/api/src/lib/tts-normalize.ts
- [[tts.service.ts]] - code - apps/api/src/services/tts.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/TTS_Text_Normalization
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_Env Config & Background Jobs]]
- 4 edges to [[_COMMUNITY_Embedding & Chunk Inspection]]
- 2 edges to [[_COMMUNITY_Admin Content & Subscriptions]]
- 2 edges to [[_COMMUNITY_Flashcards Page]]

## Top bridge nodes
- [[tts.service.ts]] - degree 32, connects to 4 communities
- [[tts-normalize.ts]] - degree 17, connects to 2 communities
- [[synthesizeSpeech()]] - degree 7, connects to 1 community
- [[synthesizeDialogueWithSegments()]] - degree 5, connects to 1 community
- [[recordTtsUsage()]] - degree 4, connects to 1 community