import pdfParse from 'pdf-parse';
import OpenAI, { toFile } from 'openai';
import { env } from '../config/env.js';
import { recordUsage, type UsageContext } from './usage.service.js';

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

async function extractWithPdfParse(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text?.trim() ?? '';
}

/** OCR fallback for scanned/image PDFs via OpenAI vision. */
async function extractWithOpenAI(
  buffer: Buffer,
  filename: string,
  usage?: UsageContext,
): Promise<string> {
  if (!openai) {
    throw new Error(
      'PDF has no selectable text (likely scanned). Set OPENAI_API_KEY to enable OCR processing.',
    );
  }

  const upload = await openai.files.create({
    file: await toFile(buffer, filename, { type: 'application/pdf' }),
    purpose: 'user_data',
  });

  try {
    const model = 'gpt-4o-mini';
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'file', file: { file_id: upload.id } },
            {
              type: 'text',
              text: 'Extract all readable text from this document. Return plain text only with no introduction, commentary, or meta phrases (do not write "Here is the extracted text" or similar). Start directly with the document content. Preserve the original language (including Uzbek if present).',
            },
          ],
        },
      ],
    });

    if (usage) {
      recordUsage({
        userId: usage.userId,
        tenantId: usage.tenantId,
        feature: 'PDF_PARSE',
        model,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
        metadata: usage.metadata,
      });
    }

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('No text could be extracted from PDF');
    }
    return text;
  } finally {
    await openai.files.del(upload.id).catch(() => {});
  }
}

/**
 * Reliable OCR for scanned/image PDFs: rasterize each page server-side and run
 * vision OCR per page (bounded concurrency with backpressure so only a few page
 * images are held in memory at once). This is the path that actually reads a
 * scanned book whose embedded text layer is empty.
 */
async function rasterizeAndOcrPdf(buffer: Buffer, usage?: UsageContext): Promise<string> {
  if (!openai) throw new Error('OPENAI_API_KEY is required for OCR');

  // Dynamic import: the rasterizer pulls a native canvas binary (@napi-rs/canvas).
  // Loading it lazily means a missing/incompatible binary only disables this path
  // (caller falls back to file OCR) instead of crashing the API at startup.
  const { pdf: rasterizePdf } = await import('pdf-to-img');
  const doc = await rasterizePdf(buffer, { scale: 2 });
  const results: string[] = [];
  const inFlight = new Set<Promise<void>>();
  let pageNo = 0;
  let truncated = false;

  for await (const png of doc) {
    if (pageNo >= env.OCR_MAX_PAGES) {
      truncated = true;
      break;
    }
    const idx = pageNo++;
    const dataUrl = `data:image/png;base64,${png.toString('base64')}`;
    let task!: Promise<void>;
    task = ocrImageDataUrl(dataUrl, usage)
      .then((text) => {
        results[idx] = text;
      })
      .catch(() => {
        results[idx] = '';
      })
      .finally(() => {
        inFlight.delete(task);
      });
    inFlight.add(task);
    // Backpressure: don't rasterize further than the OCR window (bounds memory).
    if (inFlight.size >= env.OCR_CONCURRENCY) await Promise.race(inFlight);
  }
  await Promise.all(inFlight);

  if (truncated) {
    console.warn(`rasterizeAndOcrPdf: stopped at OCR_MAX_PAGES=${env.OCR_MAX_PAGES} (document is longer)`);
  }

  return results
    .map((text, i) => (text && text.trim() ? `[${i + 1}] ${text.trim()}` : ''))
    .filter(Boolean)
    .join('\n\n');
}

export async function extractPdfText(
  buffer: Buffer,
  filename = 'document.pdf',
  usage?: UsageContext,
): Promise<string> {
  const parsed = await extractWithPdfParse(buffer);
  if (parsed) return parsed;

  // No embedded text layer (scanned/image PDF) → rasterize + vision OCR per page.
  try {
    const ocr = await rasterizeAndOcrPdf(buffer, usage);
    if (ocr.trim()) return ocr;
  } catch (err) {
    console.warn('rasterizeAndOcrPdf failed, falling back to file OCR:', (err as Error)?.message);
  }

  // Last resort: hand the whole file to the model (works for short scans).
  return extractWithOpenAI(buffer, filename, usage);
}

const OCR_INSTRUCTION =
  'Extract all readable text visible in this image, exactly as written. Preserve the original language and script (Uzbek in Latin OR Cyrillic, Russian, Arabic, or English). Write math formulas in LaTeX using $...$ (inline) or $$...$$ (display). If the page has a meaningful illustration, diagram, chart, or table, add a short description of it in square brackets, e.g. [Rasm: ...]. Return plain text only — no introduction, commentary, or meta phrases (never write "Here is the text" or "No text could be parsed"). If the image truly has no content, return an empty response.';

/** Vision OCR a single image (data URL). Reliable for scanned pages, unlike file-based OCR. */
async function ocrImageDataUrl(dataUrl: string, usage?: UsageContext): Promise<string> {
  if (!openai) {
    throw new Error('OPENAI_API_KEY is required for OCR');
  }
  const model = 'gpt-4o-mini';
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl } },
          { type: 'text', text: OCR_INSTRUCTION },
        ],
      },
    ],
  });

  if (usage) {
    recordUsage({
      userId: usage.userId,
      tenantId: usage.tenantId,
      feature: 'PDF_PARSE',
      model,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      metadata: usage.metadata,
    });
  }

  return response.choices[0]?.message?.content?.trim() ?? '';
}

/** OCR a cropped page region (image/png or jpeg) from a scanned PDF viewer selection. */
export async function extractRegionTextFromImage(
  imageBuffer: Buffer,
  usage?: UsageContext,
): Promise<string> {
  const text = await ocrImageDataUrl(`data:image/png;base64,${imageBuffer.toString('base64')}`, usage);
  if (!text) {
    throw new Error('No text could be extracted from the selected region');
  }
  return text;
}

/**
 * OCR a whole document from per-page images (data URLs rasterized by the client).
 * Pages are OCR'd with bounded concurrency and joined in order — the reliable path
 * for scanned/image PDFs that have no embedded text layer.
 */
export async function extractTextFromPageImages(
  images: string[],
  usage?: UsageContext,
  concurrency = 4,
): Promise<string> {
  if (!openai) {
    throw new Error('OPENAI_API_KEY is required for OCR');
  }
  const results = new Array<string>(images.length).fill('');
  let cursor = 0;
  async function worker() {
    while (cursor < images.length) {
      const i = cursor++;
      const img = images[i];
      if (!img) continue;
      const dataUrl = img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`;
      try {
        results[i] = await ocrImageDataUrl(dataUrl, usage);
      } catch {
        results[i] = '';
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, images.length) }, () => worker()));

  const joined = results
    .map((t, i) => (t.trim() ? `[${i + 1}] ${t.trim()}` : ''))
    .filter(Boolean)
    .join('\n\n');
  if (!joined.trim()) {
    throw new Error('No text could be extracted from the document pages');
  }
  return joined;
}
