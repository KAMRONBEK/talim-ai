---
type: community
cohesion: 0.20
members: 10
---

# B2C Ingest Stories

**Cohesion:** 0.20 - loosely connected
**Members:** 10 nodes

## Members
- [[Area B2C ingest PDFSLIDE upload, OCR, YouTube, processing job]] - document - docs/qa/user-stories-expansion.md
- [[US-IND-09 Upload a PDF → processing → READY → workspace]] - document - docs/qa/user-stories-expansion.md
- [[US-IND-10 Upload validation, size & plan-cap boundaries]] - document - docs/qa/user-stories-expansion.md
- [[US-IND-11 Scanned-PDF OCR ladder (Mistral-OCR → poppler → vision)]] - document - docs/qa/user-stories-expansion.md
- [[US-IND-12 process-content job lifecycle, failure & retry]] - document - docs/qa/user-stories-expansion.md
- [[US-IND-13 YouTube import → transcript → READY]] - document - docs/qa/user-stories-expansion.md
- [[US-IND-14 Content-status-gate UI (FAILED  processing screens)]] - document - docs/qa/user-stories-expansion.md
- [[US-IND-15 PDF reader blob load — spinner  stall-timeout  retry  abort]] - document - docs/qa/user-stories-expansion.md
- [[US-IND-16 OCR a selected PDF region (marquee → text)]] - document - docs/qa/user-stories-expansion.md
- [[US-IND-17 Dashboard upload entry points, duplicate & concurrent uploads]] - document - docs/qa/user-stories-expansion.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/B2C_Ingest_Stories
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Cross-Cutting Quality]]

## Top bridge nodes
- [[Area B2C ingest PDFSLIDE upload, OCR, YouTube, processing job]] - degree 10, connects to 1 community