import { loadPdfJs } from './pdfjs-cdn';

/**
 * Rasterize a PDF (by object/blob URL) into per-page JPEG data URLs, downscaled
 * for upload. Used by the "Re-read with OCR" flow for scanned/image PDFs that
 * have no embedded text layer — the server then vision-OCRs each page.
 */
export async function rasterizePdfToImages(
  url: string,
  opts?: { maxPages?: number; maxWidth?: number; quality?: number },
): Promise<{ images: string[]; totalPages: number }> {
  const { maxPages = 40, maxWidth = 1100, quality = 0.72 } = opts ?? {};
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument(url).promise;
  const pageCount = Math.min(doc.numPages, maxPages);
  const images: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = base.width > 0 ? Math.min(maxWidth / base.width, 2) : 1.5;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    // White background so transparent PDFs don't OCR as black-on-black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    images.push(canvas.toDataURL('image/jpeg', quality));
  }

  return { images, totalPages: doc.numPages };
}
