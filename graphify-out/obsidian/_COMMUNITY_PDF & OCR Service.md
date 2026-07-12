---
type: community
cohesion: 0.23
members: 15
---

# PDF & OCR Service

**Cohesion:** 0.23 - loosely connected
**Members:** 15 nodes

## Members
- [[OpenRouterFileAnnotation]] - code - apps/api/src/services/pdf.service.ts
- [[extractPdfPageRange()]] - code - apps/api/src/services/pdf.service.ts
- [[extractPdfText()]] - code - apps/api/src/services/pdf.service.ts
- [[extractRegionTextFromImage()]] - code - apps/api/src/services/pdf.service.ts
- [[extractWithOpenAI()]] - code - apps/api/src/services/pdf.service.ts
- [[extractWithPdfParse()]] - code - apps/api/src/services/pdf.service.ts
- [[getPdfPageCount()]] - code - apps/api/src/services/pdf.service.ts
- [[hasPrimaryOcrProvider()]] - code - apps/api/src/services/pdf.service.ts
- [[ocrImageDataUrl()]] - code - apps/api/src/services/pdf.service.ts
- [[ocrRequestOnce()]] - code - apps/api/src/services/pdf.service.ts
- [[ocrViaOpenRouter()]] - code - apps/api/src/services/pdf.service.ts
- [[pdf.service.ts]] - code - apps/api/src/services/pdf.service.ts
- [[rasterizeAndOcrPdf()]] - code - apps/api/src/services/pdf.service.ts
- [[runCli()]] - code - apps/api/src/services/pdf.service.ts
- [[runPdftoppm()]] - code - apps/api/src/services/pdf.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/PDF__OCR_Service
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_Content API Controller]]
- 8 edges to [[_COMMUNITY_Config, Pricing & Embeddings]]
- 2 edges to [[_COMMUNITY_Background Jobs & Queues]]

## Top bridge nodes
- [[pdf.service.ts]] - degree 23, connects to 3 communities
- [[extractPdfText()]] - degree 6, connects to 1 community
- [[extractRegionTextFromImage()]] - degree 6, connects to 1 community
- [[getPdfPageCount()]] - degree 4, connects to 1 community
- [[extractWithOpenAI()]] - degree 3, connects to 1 community