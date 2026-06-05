'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@talim/ui';
import { MousePointer2, Scan } from 'lucide-react';
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
const SELECTION_DEBOUNCE_MS = 50;

export type PdfSelectionMode = 'text' | 'area';

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
    span.style.userSelect = 'text';
    span.style.cursor = 'text';
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
  const selectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTextSelectingRef = useRef(false);
  const [pages, setPages] = useState<PageState[]>([]);
  const [pageWidth, setPageWidth] = useState(600);
  const [mode, setMode] = useState<PdfSelectionMode>('text');
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

  const setTextLayerSelecting = useCallback((pageNumber: number, selecting: boolean) => {
    const textLayer = pageRefs.current.get(pageNumber)?.querySelector('.textLayer');
    textLayer?.classList.toggle('selecting', selecting);
  }, []);

  const clearAllTextLayerSelecting = useCallback(() => {
    for (const pageEl of pageRefs.current.values()) {
      pageEl.querySelector('.textLayer')?.classList.remove('selecting');
    }
  }, []);

  const selectionIsInViewer = useCallback(() => {
    const sel = window.getSelection();
    if (!sel?.rangeCount || !containerRef.current) return false;
    const node = sel.getRangeAt(0).commonAncestorContainer;
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
    return Boolean(el?.closest('.textLayer') && containerRef.current.contains(el));
  }, []);

  const handleTextSelection = useCallback(() => {
    if (mode !== 'text') return;
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? '';
    if (text.length < MIN_TEXT_LENGTH || !sel?.rangeCount) {
      if (text.length < MIN_TEXT_LENGTH && !isTextSelectingRef.current) onSelectionCleared?.();
      return;
    }

    if (!selectionIsInViewer()) {
      onSelectionCleared?.();
      return;
    }

    const range = sel.getRangeAt(0);
    const rangeRect = range.getBoundingClientRect();
    if (!rangeRect.width && !rangeRect.height) {
      onSelectionCleared?.();
      return;
    }

    let pageNumber: number | undefined;
    for (const [num, pageEl] of pageRefs.current) {
      if (pageEl.contains(range.commonAncestorContainer)) {
        pageNumber = num;
        break;
      }
    }

    onExcerptSelected({
      excerpt: text,
      anchorRect: rangeRect,
      page: pageNumber,
      mode: 'text',
    });
  }, [mode, onExcerptSelected, onSelectionCleared, selectionIsInViewer]);

  useEffect(() => {
    if (mode !== 'text') return;

    const onSelectionChange = () => {
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim() ?? '';
        if (text.length < MIN_TEXT_LENGTH) {
          if (!isTextSelectingRef.current) onSelectionCleared?.();
          return;
        }
        handleTextSelection();
      }, SELECTION_DEBOUNCE_MS);
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
    };
  }, [mode, handleTextSelection, onSelectionCleared]);

  const findPageAtPoint = (clientX: number, clientY: number) => {
    for (const [num, pageEl] of pageRefs.current) {
      const rect = pageEl.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return { pageNumber: num, pageEl };
      }
    }
    return null;
  };

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

  const handlePageMouseDown = (pageNumber: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'area' || !pdfDocRef.current || !viewportByPageRef.current.has(pageNumber)) return;
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

    const onMove = (e: MouseEvent) => {
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

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, finishAreaSelection]);

  const handleTextLayerMouseDown = (pageNumber: number) => {
    if (mode !== 'text') return;
    isTextSelectingRef.current = true;
    setTextLayerSelecting(pageNumber, true);
  };

  const endTextSelecting = useCallback(() => {
    if (!isTextSelectingRef.current) return;
    isTextSelectingRef.current = false;
    clearAllTextLayerSelecting();
  }, [clearAllTextLayerSelecting]);

  const handleMouseUp = () => {
    if (mode === 'text') {
      endTextSelecting();
      requestAnimationFrame(() => handleTextSelection());
    }
  };

  const handleModeChange = (next: PdfSelectionMode) => {
    setMode(next);
    isTextSelectingRef.current = false;
    clearAllTextLayerSelecting();
    window.getSelection()?.removeAllRanges();
    setIsDragging(false);
    dragStartRef.current = null;
    updateDragRect(null);
    onSelectionCleared?.();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b bg-muted/40 px-2 py-1.5">
        <button
          type="button"
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
            mode === 'text'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => handleModeChange('text')}
        >
          <MousePointer2 className="h-3.5 w-3.5" />
          {t('pdfSelectText')}
        </button>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
            mode === 'area'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => handleModeChange('area')}
        >
          <Scan className="h-3.5 w-3.5" />
          {t('pdfSelectArea')}
        </button>
        <span className="ml-auto hidden text-[10px] text-muted-foreground sm:inline">
          {mode === 'text' ? t('pdfSelectTextHint') : t('pdfSelectAreaHint')}
        </span>
      </div>

      <div
        ref={containerRef}
        className={cn(
          'relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-2',
          mode === 'area' && 'cursor-crosshair',
        )}
        onMouseUp={handleMouseUp}
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
                {...(mode === 'area'
                  ? { onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => handlePageMouseDown(pageNumber, e) }
                  : {})}
              >
                <canvas className="pointer-events-none absolute inset-0 block h-full w-full" />
                <div
                  className={cn(
                    'textLayer absolute inset-0 z-[1]',
                    mode === 'text' ? 'select-text' : 'pointer-events-none',
                  )}
                  onMouseDown={
                    mode === 'text' ? () => handleTextLayerMouseDown(pageNumber) : undefined
                  }
                />
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
