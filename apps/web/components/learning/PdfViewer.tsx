'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@talim/ui';
import { loadPdfJs, type PdfDocumentProxy, type PdfJsModule, type PdfViewport } from '@/lib/pdfjs-cdn';
import {
  cropPageCanvasRegion,
  extractTextFromTextLayerMarquee,
  extractTextInDomRect,
  type Rect,
} from './pdf-area-selection';

const MIN_TEXT_LENGTH = 5;
const MIN_AREA_PX = 12;
const PAGE_PADDING = 4;
const MIN_PAGE_WIDTH = 280;
// Ignore sub-pixel resize jitter so a scrollbar appearing or a 1px layout shift
// never triggers a full re-rasterize of every page.
const WIDTH_EPSILON = 2;
const RESIZE_DEBOUNCE_MS = 150;
// Fit-width is 100%; the reader can scale the rendered pages up or down from there.
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

export type PdfSelectionMode = 'area';

export interface PdfExcerptPayload {
  excerpt: string;
  anchorRect: DOMRect;
  page?: number;
  mode: PdfSelectionMode;
  imageDataUrl?: string;
}

export interface PdfViewerProps {
  url: string;
  onExcerptSelected: (payload: PdfExcerptPayload) => void;
  onSelectionCleared?: () => void;
  onEmptySelection?: () => void;
  /**
   * 0–1 document position to scroll to (e.g. the active section's start). Re-scrolls
   * whenever it changes, so clicking a chapter jumps the PDF roughly to that section.
   */
  scrollToFraction?: number;
}

interface PageDimensions {
  width: number;
  height: number;
}

interface PageState {
  pageNumber: number;
  width: number;
  height: number;
}

function ensureEndOfContent(container: HTMLDivElement) {
  if (!container.querySelector('.endOfContent')) {
    const end = document.createElement('div');
    end.className = 'endOfContent';
    container.appendChild(end);
  }
}

async function renderManualTextLayer(
  pdfjs: PdfJsModule,
  page: Awaited<ReturnType<PdfDocumentProxy['getPage']>>,
  container: HTMLDivElement,
  viewport: PdfViewport,
) {
  const textContent = await page.getTextContent();
  for (const item of textContent.items) {
    if (!('str' in item) || !item.str) continue;
    const tx = pdfjs.Util.transform(viewport.transform, item.transform);
    const fontHeight = Math.hypot(tx[2] ?? 0, tx[3] ?? 0) || 12;
    const span = document.createElement('span');
    span.textContent = item.str;
    span.style.position = 'absolute';
    span.style.left = `${tx[4] ?? 0}px`;
    span.style.top = `${(tx[5] ?? 0) - fontHeight}px`;
    span.style.fontSize = `${fontHeight}px`;
    span.style.fontFamily = 'sans-serif';
    span.style.whiteSpace = 'pre';
    span.style.color = 'transparent';
    span.style.userSelect = 'none';
    container.appendChild(span);
  }
  ensureEndOfContent(container);
}

async function renderTextLayer(
  pdfjs: PdfJsModule,
  page: Awaited<ReturnType<PdfDocumentProxy['getPage']>>,
  container: HTMLDivElement,
  viewport: PdfViewport,
) {
  container.innerHTML = '';

  if (pdfjs.TextLayer) {
    const textContent = await page.getTextContent();
    const textLayer = new pdfjs.TextLayer({
      textContentSource: textContent,
      container,
      viewport,
    });
    await textLayer.render();
    ensureEndOfContent(container);

    if (container.querySelectorAll('span').length === 0) {
      container.innerHTML = '';
      await renderManualTextLayer(pdfjs, page, container, viewport);
    }
    return;
  }

  await renderManualTextLayer(pdfjs, page, container, viewport);
}

export function PdfViewer({
  url,
  onExcerptSelected,
  onSelectionCleared,
  onEmptySelection,
  scrollToFraction,
}: PdfViewerProps) {
  const t = useTranslations('content');
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const dragRectRef = useRef<Rect | null>(null);
  const pdfDocRef = useRef<PdfDocumentProxy | null>(null);
  const pdfjsRef = useRef<PdfJsModule | null>(null);
  // Intrinsic (scale 1) page dimensions, captured once per document. Display sizes
  // and re-renders are derived from these without ever re-downloading the PDF.
  const pageDimsRef = useRef<Map<number, PageDimensions>>(new Map());
  const viewportByPageRef = useRef<Map<number, PdfViewport>>(new Map());
  // 0 = not yet measured. We measure synchronously before paint so the first
  // render already uses the real width (no 600px → real-width re-render flash).
  const [pageWidth, setPageWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [pages, setPages] = useState<PageState[]>([]);
  const [dragRect, setDragRect] = useState<Rect | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Display scale (1 = fit width) and the page currently at the top of the viewport,
  // both view-local: they drive the toolbar zoom/page-indicator without touching the
  // document fetch, RAG sections, or any prop/handler contract.
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRafRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; pageNumber: number } | null>(null);

  // Scroll to an active section's approximate page when it changes (clicking a chapter
  // in the sidebar). Pages are all built up-front, so once numPages is known the target
  // page div exists in pageRefs. Re-runs only when the fraction changes, so it never
  // fights the user's manual scroll within a section.
  useEffect(() => {
    if (scrollToFraction == null || numPages <= 0) return;
    const targetPage = Math.min(numPages, Math.max(1, Math.round(scrollToFraction * numPages) || 1));
    pageRefs.current.get(targetPage)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [scrollToFraction, numPages]);

  // Measure the container width before paint and keep it in sync, debounced so a
  // resize gesture doesn't re-rasterize every page on each animation frame.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => Math.max(MIN_PAGE_WIDTH, el.clientWidth - PAGE_PADDING * 2);
    setPageWidth((prev) => {
      const next = measure();
      return Math.abs(prev - next) > WIDTH_EPSILON ? next : prev;
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setPageWidth((prev) => {
          const next = measure();
          return Math.abs(prev - next) > WIDTH_EPSILON ? next : prev;
        });
      }, RESIZE_DEBOUNCE_MS);
    });
    ro.observe(el);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  // Load the document ONCE per url and capture intrinsic page dimensions. This is
  // independent of width, so resizing never re-downloads or re-parses the PDF.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setNumPages(0);
    setPages([]);
    setCurrentPage(1);
    pageDimsRef.current = new Map();
    viewportByPageRef.current.clear();
    pdfDocRef.current = null;

    void (async () => {
      try {
        const pdfjs = await loadPdfJs();
        if (cancelled) return;
        pdfjsRef.current = pdfjs;
        const doc = await pdfjs.getDocument(url).promise;
        if (cancelled) return;
        pdfDocRef.current = doc;
        const dims = new Map<number, PageDimensions>();
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          if (cancelled) return;
          const viewport = page.getViewport({ scale: 1 });
          dims.set(i, { width: viewport.width, height: viewport.height });
        }
        if (cancelled) return;
        pageDimsRef.current = dims;
        setNumPages(doc.numPages);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      pdfDocRef.current = null;
      pageDimsRef.current = new Map();
      viewportByPageRef.current.clear();
    };
  }, [url]);

  // Derive display sizes from the cached intrinsic dimensions whenever the width
  // changes. Cheap, synchronous, and keeps each page's aspect ratio fixed so there
  // is no layout shift while pages re-render.
  useEffect(() => {
    if (!numPages || pageWidth <= 0) return;
    const dims = pageDimsRef.current;
    const displayWidth = Math.round(pageWidth * zoom);
    const next: PageState[] = [];
    for (let i = 1; i <= numPages; i++) {
      const dim = dims.get(i);
      if (!dim) continue;
      const height = dim.width > 0 ? (displayWidth * dim.height) / dim.width : displayWidth;
      next.push({ pageNumber: i, width: displayWidth, height });
    }
    setPages(next);
  }, [numPages, pageWidth, zoom]);

  // Rasterize each page + its text layer. Depends only on `pages` (which already
  // changes when the width changes), so it runs exactly once per layout change.
  useEffect(() => {
    if (!pages.length || !pdfDocRef.current || !pdfjsRef.current) return;

    let cancelled = false;

    void (async () => {
      const doc = pdfDocRef.current;
      const pdfjs = pdfjsRef.current;
      if (!doc || !pdfjs) return;

      for (const { pageNumber, width } of pages) {
        if (cancelled) return;
        const pageEl = pageRefs.current.get(pageNumber);
        if (!pageEl) continue;

        const canvas = pageEl.querySelector('canvas');
        const textLayer = pageEl.querySelector('.textLayer') as HTMLDivElement | null;
        if (!canvas || !textLayer) continue;

        const page = await doc.getPage(pageNumber);
        if (cancelled) return;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = baseViewport.width > 0 ? width / baseViewport.width : 1;
        const scaledViewport = page.getViewport({ scale });
        viewportByPageRef.current.set(pageNumber, scaledViewport);

        if (canvas.width !== scaledViewport.width) canvas.width = scaledViewport.width;
        if (canvas.height !== scaledViewport.height) canvas.height = scaledViewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas }).promise;
        if (cancelled) return;

        await renderTextLayer(pdfjs, page, textLayer, scaledViewport);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pages]);

  const finishAreaSelection = useCallback(
    async (dragStart: { x: number; y: number; pageNumber: number }, rect: Rect) => {
      const doc = pdfDocRef.current;
      const pdfjs = pdfjsRef.current;
      const pageNumber = dragStart.pageNumber;
      const pageEl = pageRefs.current.get(pageNumber);
      const viewport = viewportByPageRef.current.get(pageNumber);
      if (!doc || !pdfjs || !pageEl || !viewport) return;
      if (rect.width < MIN_AREA_PX || rect.height < MIN_AREA_PX) {
        onSelectionCleared?.();
        return;
      }

      try {
        const imageDataUrl = cropPageCanvasRegion(pageEl, rect);
        if (!imageDataUrl) {
          onEmptySelection?.();
          onSelectionCleared?.();
          return;
        }

        let excerpt = extractTextFromTextLayerMarquee(pageEl, rect);
        if (excerpt.length < MIN_TEXT_LENGTH) {
          const page = await doc.getPage(pageNumber);
          const textContent = await page.getTextContent();
          excerpt = extractTextInDomRect(
            textContent.items,
            rect,
            viewport.transform,
            pdfjs.Util.transform,
          );
        }

        const pageRect = pageEl.getBoundingClientRect();
        const anchorRect = new DOMRect(
          pageRect.left + rect.left,
          pageRect.top + rect.top,
          rect.width,
          rect.height,
        );

        onExcerptSelected({
          excerpt,
          anchorRect,
          page: pageNumber,
          mode: 'area',
          imageDataUrl,
        });
      } catch {
        onSelectionCleared?.();
      }
    },
    [onEmptySelection, onExcerptSelected, onSelectionCleared],
  );

  const handlePagePointerDown = (pageNumber: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (!pdfDocRef.current || !viewportByPageRef.current.has(pageNumber)) return;
    const pageEl = pageRefs.current.get(pageNumber);
    if (!pageEl) return;
    e.preventDefault();
    e.stopPropagation();
    window.getSelection()?.removeAllRanges();
    const pageRect = pageEl.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - pageRect.left,
      y: e.clientY - pageRect.top,
      pageNumber,
    };
    setIsDragging(true);
    updateDragRect({
      left: dragStartRef.current.x,
      top: dragStartRef.current.y,
      width: 0,
      height: 0,
    });
  };

  const updateDragRect = (rect: Rect | null) => {
    dragRectRef.current = rect;
    setDragRect(rect);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: PointerEvent) => {
      if (!dragStartRef.current) return;
      const pageEl = pageRefs.current.get(dragStartRef.current.pageNumber);
      if (!pageEl) return;
      const pageRect = pageEl.getBoundingClientRect();
      const currentX = Math.max(0, Math.min(e.clientX - pageRect.left, pageRect.width));
      const currentY = Math.max(0, Math.min(e.clientY - pageRect.top, pageRect.height));
      const startX = dragStartRef.current.x;
      const startY = dragStartRef.current.y;
      updateDragRect({
        left: Math.min(startX, currentX),
        top: Math.min(startY, currentY),
        width: Math.abs(currentX - startX),
        height: Math.abs(currentY - startY),
      });
    };

    const onUp = () => {
      if (!dragStartRef.current || !dragRectRef.current) {
        setIsDragging(false);
        dragStartRef.current = null;
        updateDragRect(null);
        return;
      }
      const start = dragStartRef.current;
      const rect = dragRectRef.current;
      setIsDragging(false);
      dragStartRef.current = null;
      updateDragRect(null);
      void finishAreaSelection(start, rect);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging, finishAreaSelection]);

  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100)),
    [],
  );
  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100)),
    [],
  );

  // Track which page sits at the top of the viewport so the toolbar can show "page X of N".
  // rAF-throttled and reads offsetTop against the (position:relative) scroll container.
  const handleScroll = useCallback(() => {
    if (scrollRafRef.current != null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = containerRef.current;
      if (!el) return;
      const marker = el.scrollTop + el.clientHeight * 0.25;
      let current = 1;
      for (const [pageNumber, pageEl] of pageRefs.current) {
        if (pageEl.offsetTop <= marker) current = Math.max(current, pageNumber);
      }
      setCurrentPage((prev) => (prev === current ? prev : current));
    });
  }, []);

  useEffect(
    () => () => {
      if (scrollRafRef.current != null) cancelAnimationFrame(scrollRafRef.current);
    },
    [],
  );

  const showLoading = !error && (loading || pages.length === 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/70 bg-muted/40 px-3 py-1.5">
        {numPages > 0 && (
          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
            {t('pdfPageOf', { page: currentPage, total: numPages })}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
          {t('pdfSelectAreaHint')}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= ZOOM_MIN}
            aria-label={t('pdfZoomOut')}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-10 text-center text-[11px] font-medium tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= ZOOM_MAX}
            aria-label={t('pdfZoomIn')}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative min-h-0 flex-1 cursor-crosshair overflow-auto overscroll-contain px-1 py-2"
      >
        {showLoading && <p className="p-4 text-sm text-muted-foreground">{t('pdfLoading')}</p>}
        {error && <p className="p-4 text-sm text-destructive">{t('pdfLoadError')}</p>}
        {!error &&
          pages.map(({ pageNumber, width, height }) => (
            <div
              key={pageNumber}
              ref={(el) => {
                if (el) pageRefs.current.set(pageNumber, el);
                else pageRefs.current.delete(pageNumber);
              }}
              className="pdf-page relative mx-auto mb-3 bg-white shadow-sm"
              style={{ width, height }}
            >
              <div
                className={cn(
                  'pdf-page-inner relative h-full w-full overflow-hidden',
                  isDragging && dragStartRef.current?.pageNumber === pageNumber && 'touch-none',
                )}
                onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => handlePagePointerDown(pageNumber, e)}
              >
                <canvas className="pointer-events-none absolute inset-0 block h-full w-full" />
                <div className="textLayer pointer-events-none absolute inset-0 z-[1]" />
              </div>
              {isDragging &&
                dragStartRef.current?.pageNumber === pageNumber &&
                dragRect && (
                  <div
                    className="pdf-marquee pointer-events-none absolute z-[2] border-2 border-primary bg-primary/10"
                    style={{
                      left: dragRect.left,
                      top: dragRect.top,
                      width: dragRect.width,
                      height: dragRect.height,
                    }}
                  />
                )}
            </div>
          ))}
      </div>
    </div>
  );
}
