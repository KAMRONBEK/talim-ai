---
type: community
cohesion: 0.18
members: 19
---

# Usage Pricing & PDF Extraction

**Cohesion:** 0.18 - loosely connected
**Members:** 19 nodes

## Members
- [[OpenRouterFileAnnotation]] - code - apps/api/src/services/pdf.service.ts
- [[RecordUsageInput]] - code - apps/api/src/services/usage.service.ts
- [[TOKEN_PRICING_PER_MILLION]] - code - apps/api/src/config/usage-pricing.ts
- [[captionPage()]] - code - apps/api/src/services/figure.service.ts
- [[estimateCost()]] - code - apps/api/src/services/usage.service.ts
- [[estimateTokenCostUsd()]] - code - apps/api/src/config/usage-pricing.ts
- [[extractPdfText()]] - code - apps/api/src/services/pdf.service.ts
- [[extractRegionTextFromImage()]] - code - apps/api/src/services/pdf.service.ts
- [[extractWithOpenAI()]] - code - apps/api/src/services/pdf.service.ts
- [[extractWithPdfParse()]] - code - apps/api/src/services/pdf.service.ts
- [[hasPrimaryOcrProvider()]] - code - apps/api/src/services/pdf.service.ts
- [[ocrImageDataUrl()]] - code - apps/api/src/services/pdf.service.ts
- [[ocrViaOpenRouter()]] - code - apps/api/src/services/pdf.service.ts
- [[pdf.service.ts]] - code - apps/api/src/services/pdf.service.ts
- [[rasterizeAndOcrPdf()]] - code - apps/api/src/services/pdf.service.ts
- [[recordUsage()]] - code - apps/api/src/services/usage.service.ts
- [[runPdftoppm()]] - code - apps/api/src/services/pdf.service.ts
- [[usage-pricing.ts]] - code - apps/api/src/config/usage-pricing.ts
- [[usage.service.ts]] - code - apps/api/src/services/usage.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Usage_Pricing__PDF_Extraction
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_Embedding Inspection Script]]
- 4 edges to [[_COMMUNITY_Env Config & Background Job Registration]]
- 4 edges to [[_COMMUNITY_Tenant Content Controller]]
- 4 edges to [[_COMMUNITY_AI Summary Generation]]
- 3 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 3 edges to [[_COMMUNITY_AI Service (DeepSeektools)]]
- 3 edges to [[_COMMUNITY_TTS Normalization Service]]
- 3 edges to [[_COMMUNITY_YouTube Transcription Service]]
- 2 edges to [[_COMMUNITY_Subscription Service]]
- 1 edge to [[_COMMUNITY_Admin Audit & Content Controller]]
- 1 edge to [[_COMMUNITY_LearnerSectionUsage Controllers]]
- 1 edge to [[_COMMUNITY_Admin Tenants Controller]]

## Top bridge nodes
- [[usage.service.ts]] - degree 21, connects to 9 communities
- [[pdf.service.ts]] - degree 19, connects to 4 communities
- [[recordUsage()]] - degree 16, connects to 4 communities
- [[extractRegionTextFromImage()]] - degree 6, connects to 2 communities
- [[extractPdfText()]] - degree 6, connects to 1 community