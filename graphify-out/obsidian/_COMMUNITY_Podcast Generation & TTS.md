---
type: community
cohesion: 0.10
members: 33
---

# Podcast Generation & TTS

**Cohesion:** 0.10 - loosely connected
**Members:** 33 nodes

## Members
- [[AZURE_LANG]] - code - apps/api/src/services/tts.service.ts
- [[AZURE_VOICES_BY_LOCALE]] - code - apps/api/src/services/tts.service.ts
- [[DialogueSegmentBytes]] - code - apps/api/src/services/tts.service.ts
- [[DialogueTurn]] - code - apps/api/src/services/tts.service.ts
- [[EN_ACRONYMS]] - code - apps/api/src/lib/tts-normalize.ts
- [[GeneratePodcastJobData]] - code - apps/api/src/services/queue.service.ts
- [[OPENAI_VOICES_BY_LOCALE]] - code - apps/api/src/services/tts.service.ts
- [[OpenAiVoice]] - code - apps/api/src/services/tts.service.ts
- [[Speaker]] - code - apps/api/src/services/tts.service.ts
- [[azureConfigured]] - code - apps/api/src/services/tts.service.ts
- [[azurePostWithRetry()]] - code - apps/api/src/services/tts.service.ts
- [[buildPodcastSegments()]] - code - apps/api/src/jobs/generatePodcast.job.ts
- [[buildPodcastUserPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[escapeXml()]] - code - apps/api/src/services/tts.service.ts
- [[generatePodcast.job.ts]] - code - apps/api/src/jobs/generatePodcast.job.ts
- [[getPodcastSystemPrompt()]] - code - apps/api/src/lib/locale-prompts.ts
- [[mapLimit()]] - code - apps/api/src/services/tts.service.ts
- [[normalizeEnglish()]] - code - apps/api/src/lib/tts-normalize.ts
- [[normalizeScriptForTts()]] - code - apps/api/src/lib/tts-normalize.ts
- [[openai_3]] - code - apps/api/src/services/tts.service.ts
- [[parsePodcastDialogue()]] - code - apps/api/src/lib/locale-prompts.ts
- [[recordTtsUsage()]] - code - apps/api/src/services/tts.service.ts
- [[sanitizeForXml()]] - code - apps/api/src/services/tts.service.ts
- [[sleep()]] - code - apps/api/src/services/tts.service.ts
- [[splitScriptIntoChunks()]] - code - apps/api/src/lib/tts-normalize.ts
- [[synthesizeChunk()]] - code - apps/api/src/services/tts.service.ts
- [[synthesizeChunkAzure()]] - code - apps/api/src/services/tts.service.ts
- [[synthesizeChunkOpenai()]] - code - apps/api/src/services/tts.service.ts
- [[synthesizeDialogue()]] - code - apps/api/src/services/tts.service.ts
- [[synthesizeDialogueWithSegments()]] - code - apps/api/src/services/tts.service.ts
- [[synthesizeSpeech()]] - code - apps/api/src/services/tts.service.ts
- [[tts-normalize.ts]] - code - apps/api/src/lib/tts-normalize.ts
- [[tts.service.ts]] - code - apps/api/src/services/tts.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Podcast_Generation__TTS
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 5 edges to [[_COMMUNITY_Job Event Fan-out & Media Jobs]]
- 4 edges to [[_COMMUNITY_AI Prompt Builders]]
- 4 edges to [[_COMMUNITY_Usage Pricing & Metering]]
- 3 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 2 edges to [[_COMMUNITY_Prisma Client & Seed]]
- 2 edges to [[_COMMUNITY_AI Tutor Chat Controller]]
- 2 edges to [[_COMMUNITY_Flashcards UI]]
- 1 edge to [[_COMMUNITY_AI Provider Service]]
- 1 edge to [[_COMMUNITY_Summary Controller]]
- 1 edge to [[_COMMUNITY_Transcript Panel UI]]
- 1 edge to [[_COMMUNITY_Learner Controller]]

## Top bridge nodes
- [[generatePodcast.job.ts]] - degree 29, connects to 10 communities
- [[tts.service.ts]] - degree 33, connects to 5 communities
- [[tts-normalize.ts]] - degree 7, connects to 2 communities
- [[synthesizeSpeech()]] - degree 7, connects to 1 community
- [[recordTtsUsage()]] - degree 4, connects to 1 community