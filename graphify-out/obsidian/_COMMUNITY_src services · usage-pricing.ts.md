---
type: community
cohesion: 0.16
members: 24
---

# src services · usage-pricing.ts

**Cohesion:** 0.16 - loosely connected
**Members:** 24 nodes

## Members
- [[OpenRouterFileAnnotation]] - code - apps/api/src/services/pdf.service.ts
- [[RecordUsageInput]] - code - apps/api/src/services/usage.service.ts
- [[TOKEN_PRICING_PER_MILLION]] - code - apps/api/src/config/usage-pricing.ts
- [[UsageContext]] - code - apps/api/src/services/usage.service.ts
- [[captionPage()]] - code - apps/api/src/services/figure.service.ts
- [[estimateCost()]] - code - apps/api/src/services/usage.service.ts
- [[estimateTokenCostUsd()]] - code - apps/api/src/config/usage-pricing.ts
- [[extractPdfPageRange()]] - code - apps/api/src/services/pdf.service.ts
- [[extractPdfText()]] - code - apps/api/src/services/pdf.service.ts
- [[extractWithOpenAI()]] - code - apps/api/src/services/pdf.service.ts
- [[extractWithPdfParse()]] - code - apps/api/src/services/pdf.service.ts
- [[figure.service.ts]] - code - apps/api/src/services/figure.service.ts
- [[getPdfPageCount()]] - code - apps/api/src/services/pdf.service.ts
- [[hasPrimaryOcrProvider()]] - code - apps/api/src/services/pdf.service.ts
- [[ocrImageDataUrl()]] - code - apps/api/src/services/pdf.service.ts
- [[ocrRequestOnce()]] - code - apps/api/src/services/pdf.service.ts
- [[ocrViaOpenRouter()]] - code - apps/api/src/services/pdf.service.ts
- [[pdf.service.ts]] - code - apps/api/src/services/pdf.service.ts
- [[rasterizeAndOcrPdf()]] - code - apps/api/src/services/pdf.service.ts
- [[recordUsage()]] - code - apps/api/src/services/usage.service.ts
- [[runCli()]] - code - apps/api/src/services/pdf.service.ts
- [[runPdftoppm()]] - code - apps/api/src/services/pdf.service.ts
- [[usage-pricing.ts]] - code - apps/api/src/config/usage-pricing.ts
- [[usage.service.ts]] - code - apps/api/src/services/usage.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/src_services__usage-pricingts
SORT file.name ASC
```

## Connections to other communities
- 12 edges to [[_COMMUNITY_src services · env.ts]]
- 11 edges to [[_COMMUNITY_src services]]
- 7 edges to [[_COMMUNITY_subscription]]
- 6 edges to [[_COMMUNITY_src controllers · sendContentFile()]]
- 4 edges to [[_COMMUNITY_src controllers · content.controller.ts]]
- 4 edges to [[_COMMUNITY_src services · tts-normalize.ts]]
- 3 edges to [[_COMMUNITY_src services · TutorGraphIntent]]
- 2 edges to [[_COMMUNITY_controllers admin]]

## Top bridge nodes
- [[usage.service.ts]] - degree 22, connects to 6 communities
- [[figure.service.ts]] - degree 14, connects to 5 communities
- [[recordUsage()]] - degree 16, connects to 4 communities
- [[pdf.service.ts]] - degree 23, connects to 3 communities
- [[UsageContext]] - degree 9, connects to 3 communities