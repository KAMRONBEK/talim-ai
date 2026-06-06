'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
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
}

interface PageState {
  pageNumber: number;
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
}: PdfViewerProps) {
  const t = useTranslations('content');
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const dragRectRef = useRef<Rect | null>(null);
  const pdfDocRef = useRef<PdfDocumentProxy | null>(null);
  const pdfjsRef = useRef<PdfJsModule | null>(null);
  const viewportByPageRef = useRef<Map<number, PdfViewport>>(new Map());
  const pagesRenderedRef = useRef(false);
  const [pages, setPages] = useState<PageState[]>([]);
  const [pageWidth, setPageWidth] = useState(600);
  const [dragRect, setDragRect] = useState<Rect | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; pageNumber: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setPageWidth(Math.max(280, el.clientWidth - PAGE_PADDING * 2));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setPages([]);
    pagesRenderedRef.current = false;

    void (async () => {
      try {
        const pdfjs = await loadPdfJs();
        if (cancelled) return;
        pdfjsRef.current = pdfjs;
        const doc = await pdfjs.getDocument(url).promise;
        if (cancelled) return;
        pdfDocRef.current = doc;
        const nextPages: PageState[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          const scale = pageWidth / viewport.width;
          const scaled = page.getViewport({ scale });
          nextPages.push({ pageNumber: i, height: scaled.height });
        }
        if (!cancelled) setPages(nextPages);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      pdfDocRef.current = null;
      viewportByPageRef.current.clear();
      pagesRenderedRef.current = false;
    };
  }, [url, pageWidth]);

  useEffect(() => {
    if (!pages.length || !pdfDocRef.current || !pdfjsRef.current) return;

    let cancelled = false;
    pagesRenderedRef.current = false;

    void (async () => {
      const doc = pdfDocRef.current;
      const pdfjs = pdfjsRef.current;
      if (!doc || !pdfjs) return;

      for (const { pageNumber } of pages) {
        if (cancelled) return;
        const pageEl = pageRefs.current.get(pageNumber);
        if (!pageEl) continue;

        const canvas = pageEl.querySelector('canvas');
        const textLayer = pageEl.querySelector('.textLayer') as HTMLDivElement | null;
        if (!canvas || !textLayer) continue;

        const page = await doc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        const scale = pageWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        viewportByPageRef.current.set(pageNumber, scaledViewport);

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas }).promise;
        if (cancelled) return;

        await renderTextLayer(pdfjs, page, textLayer, scaledViewport);
      }

      if (!cancelled) pagesRenderedRef.current = true;
    })();

    return () => {
      cancelled = true;
      pagesRenderedRef.current = false;
    };
  }, [pages, pageWidth]);

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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center border-b bg-muted/40 px-3 py-1.5">
        <span className="text-[10px] text-muted-foreground">{t('pdfSelectAreaHint')}</span>
      </div>

      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 cursor-crosshair overflow-y-auto overscroll-contain px-1 py-2"
      >
        {loading && <p className="p-4 text-sm text-muted-foreground">{t('pdfLoading')}</p>}
        {error && <p className="p-4 text-sm text-destructive">{t('pdfLoadError')}</p>}
        {!loading &&
          !error &&
          pages.map(({ pageNumber, height }) => (
            <div
              key={pageNumber}
              ref={(el) => {
                if (el) pageRefs.current.set(pageNumber, el);
                else pageRefs.current.delete(pageNumber);
              }}
              className="pdf-page relative mx-auto mb-3 bg-white shadow-sm"
              style={{ width: pageWidth, height }}
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
