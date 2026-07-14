---
source_file: "apps/api/src/jobs/generatePodcast.job.ts"
type: "code"
community: "Podcast Generation & TTS"
location: "L1"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/Podcast_Generation__TTS
---

# generatePodcast.job.ts

## Connections
- [[DialogueSegmentBytes]] - `imports` [EXTRACTED]
- [[DialogueTurn]] - `imports` [EXTRACTED]
- [[GeneratePodcastJobData]] - `imports` [EXTRACTED]
- [[PodcastSegment]] - `imports` [EXTRACTED]
- [[StorageService]] - `imports` [EXTRACTED]
- [[ai.service.ts]] - `imports_from` [EXTRACTED]
- [[boundContextByTokens()]] - `imports` [EXTRACTED]
- [[buildPodcastSegments()]] - `contains` [EXTRACTED]
- [[buildPodcastUserPrompt()]] - `imports` [EXTRACTED]
- [[buildRagContext()]] - `imports` [EXTRACTED]
- [[generateChatCompletion()]] - `imports` [EXTRACTED]
- [[getPodcastSystemPrompt()]] - `imports` [EXTRACTED]
- [[index.ts]] - `imports_from` [EXTRACTED]
- [[index.ts_2]] - `imports_from` [EXTRACTED]
- [[jobEventAudience.ts]] - `imports_from` [EXTRACTED]
- [[locale-prompts.ts]] - `imports_from` [EXTRACTED]
- [[parseAppLocale()]] - `imports` [EXTRACTED]
- [[parsePodcastDialogue()]] - `imports` [EXTRACTED]
- [[podcastQueue]] - `imports` [EXTRACTED]
- [[prisma_2]] - `imports` [EXTRACTED]
- [[prisma.ts]] - `imports_from` [EXTRACTED]
- [[publishContentEvent()]] - `imports` [EXTRACTED]
- [[queue.service.ts]] - `imports_from` [EXTRACTED]
- [[rag.service.ts]] - `imports_from` [EXTRACTED]
- [[registerGeneratePodcastJob()]] - `contains` [EXTRACTED]
- [[storage.service.ts]] - `imports_from` [EXTRACTED]
- [[synthesizeDialogueWithSegments()]] - `imports` [EXTRACTED]
- [[synthesizeSpeech()]] - `imports` [EXTRACTED]
- [[tts.service.ts]] - `imports_from` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/Podcast_Generation__TTS