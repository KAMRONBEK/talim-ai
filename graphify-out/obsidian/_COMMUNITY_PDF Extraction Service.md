---
type: community
cohesion: 0.21
members: 16
---

# PDF Extraction Service

**Cohesion:** 0.21 - loosely connected
**Members:** 16 nodes

## Members
- [[OpenRouterFileAnnotation]] - code - apps/api/src/services/pdf.service.ts
- [[extractPdfPageRange()]] - code - apps/api/src/services/pdf.service.ts
- [[extractPdfText()]] - code - apps/api/src/services/pdf.service.ts
- [[extractRegionTextFromImage()]] - code - apps/api/src/services/pdf.service.ts
- [[extractTextFromPageImages()]] - code - apps/api/src/services/pdf.service.ts
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
TABLE source_file, type FROM #community/PDF_Extraction_Service
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 6 edges to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 6 edges to [[_COMMUNITY_Usage Pricing & Metering]]

## Top bridge nodes
- [[pdf.service.ts]] - degree 24, connects to 3 communities
- [[extractPdfText()]] - degree 6, connects to 1 community
- [[extractRegionTextFromImage()]] - degree 6, connects to 1 community
- [[getPdfPageCount()]] - degree 4, connects to 1 community
- [[extractWithOpenAI()]] - degree 3, connects to 1 community