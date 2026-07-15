export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const INTERSECT_TOLERANCE = 3;

interface PdfTextItem {
  str?: string;
  transform: number[];
  width?: number;
  height?: number;
}

type PdfTextContentItem = PdfTextItem | { type: string };

function rectsIntersect(a: Rect, b: Rect, tolerance = 0): boolean {
  return (
    a.left - tolerance < b.left + b.width &&
    a.left + a.width + tolerance > b.left &&
    a.top - tolerance < b.top + b.height &&
    a.top + a.height + tolerance > b.top
  );
}

function isTextItem(item: PdfTextContentItem): item is PdfTextItem {
  return 'str' in item;
}

function estimateTextWidth(str: string, fontHeight: number): number {
  return fontHeight * Math.max(str.length * 0.5, 0.5);
}

function getViewportTextBounds(
  item: PdfTextItem,
  viewportTransform: number[],
  transform: (m1: number[], m2: number[]) => number[],
): Rect {
  const tx = transform(viewportTransform, item.transform);
  const fontHeight = Math.hypot(tx[2] ?? 0, tx[3] ?? 0) || item.height || 12;
  const scaleX = Math.abs(tx[0] ?? 1);
  const rawWidth = item.width ?? estimateTextWidth(item.str ?? '', fontHeight);
  const width = rawWidth * scaleX || fontHeight;
  return {
    left: tx[4] ?? 0,
    top: (tx[5] ?? 0) - fontHeight,
    width,
    height: fontHeight,
  };
}

function clientRectsIntersect(
  marquee: { left: number; top: number; right: number; bottom: number },
  target: DOMRect,
  tolerance = INTERSECT_TOLERANCE,
): boolean {
  return (
    marquee.left - tolerance < target.right &&
    marquee.right + tolerance > target.left &&
    marquee.top - tolerance < target.bottom &&
    marquee.bottom + tolerance > target.top
  );
}

/** Crop a page canvas region to a PNG data URL for OCR. */
export function cropPageCanvasRegion(pageEl: HTMLElement, domRect: Rect): string | null {
  const canvas = pageEl.querySelector('canvas');
  if (!canvas || pageEl.clientWidth === 0 || pageEl.clientHeight === 0) return null;

  const scaleX = canvas.width / pageEl.clientWidth;
  const scaleY = canvas.height / pageEl.clientHeight;
  const sx = Math.round(domRect.left * scaleX);
  const sy = Math.round(domRect.top * scaleY);
  const sw = Math.max(1, Math.round(domRect.width * scaleX));
  const sh = Math.max(1, Math.round(domRect.height * scaleY));

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = sw;
  cropCanvas.height = sh;
  const ctx = cropCanvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return cropCanvas.toDataURL('image/png');
}

/** Extract text from rendered text-layer spans inside a page-relative marquee rect. */
export function extractTextFromTextLayerMarquee(pageEl: HTMLElement, domRect: Rect): string {
  const pageRect = pageEl.getBoundingClientRect();
  const marquee = {
    left: pageRect.left + domRect.left,
    top: pageRect.top + domRect.top,
    right: pageRect.left + domRect.left + domRect.width,
    bottom: pageRect.top + domRect.top + domRect.height,
  };

  const parts: { str: string; x: number; y: number }[] = [];

  for (const span of pageEl.querySelectorAll('.textLayer span')) {
    const str = span.textContent?.trim();
    if (!str) continue;
    const bounds = span.getBoundingClientRect();
    if (!clientRectsIntersect(marquee, bounds)) continue;
    parts.push({ str, x: bounds.left, y: bounds.top });
  }

  parts.sort((a, b) => {
    if (Math.abs(a.y - b.y) > 4) return a.y - b.y;
    return a.x - b.x;
  });

  return parts
    .map((p) => p.str)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract text whose viewport bounds intersect a DOM-pixel rect (top-left origin). */
export function extractTextInDomRect(
  items: PdfTextContentItem[],
  domRect: Rect,
  viewportTransform: number[],
  transform: (m1: number[], m2: number[]) => number[],
): string {
  const parts: { str: string; x: number; y: number }[] = [];

  for (const item of items) {
    if (!isTextItem(item) || !item.str?.trim()) continue;
    const bounds = getViewportTextBounds(item, viewportTransform, transform);
    if (!rectsIntersect(domRect, bounds, INTERSECT_TOLERANCE)) continue;
    parts.push({ str: item.str, x: bounds.left, y: bounds.top });
  }

  parts.sort((a, b) => {
    if (Math.abs(a.y - b.y) > 4) return a.y - b.y;
    return a.x - b.x;
  });

  return parts
    .map((p) => p.str)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
