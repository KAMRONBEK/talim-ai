import { spawn } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pdfParse from 'pdf-parse';
import OpenAI, { toFile } from 'openai';
import { env } from '../config/env.js';
import { recordUsage, type UsageContext } from './usage.service.js';

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

// Optional dedicated document OCR (Mistral). When configured it's the PRIMARY
// scanned-PDF path: it transcribes verbatim (no re-diacritization of Quranic
// verses) entirely server-side. Called over plain HTTPS with the built-in fetch —
// no SDK — to avoid any ESM/CJS module-resolution surface in the prod image.
const MISTRAL_API = 'https://api.mistral.ai/v1';

/** True when a dedicated OCR provider is configured (primary scanned-PDF path). */
export const hasPrimaryOcrProvider = (): boolean => env.MISTRAL_API_KEY.length > 0;

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

const OCR_DPI = 300; // 300 keeps Arabic harakat / small Cyrillic legible; 150 drops them.
const PDFTOPPM_TIMEOUT_MS = 120_000;

/**
 * Rasterize a page range of a PDF to PNGs with poppler's `pdftoppm` — a battle-
 * tested CLI tool, NOT a fragile native node binding. Writes `<prefix>-NNN.png`.
 * Rejects with ENOENT when pdftoppm isn't installed, so the caller can fall back.
 */
function runPdftoppm(
  pdfPath: string,
  prefix: string,
  first: number,
  last: number,
  dpi: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('pdftoppm', [
      '-png',
      '-r',
      String(dpi),
      '-f',
      String(first),
      '-l',
      String(last),
      pdfPath,
      prefix,
    ]);
    let stderr = '';
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    // Don't let a malformed page hang a worker that is also the API.
    const timer = setTimeout(() => proc.kill('SIGKILL'), PDFTOPPM_TIMEOUT_MS);
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      code === 0
        ? resolve()
        : reject(new Error(`pdftoppm exited ${code}: ${stderr.slice(0, 200)}`));
    });
  });
}

/**
 * Reliable OCR for scanned/image PDFs: rasterize pages with `pdftoppm` in small
 * batches, then vision-OCR each page. Page images live on disk in a temp dir and
 * are deleted as soon as they're OCR'd, so memory and disk stay bounded even for
 * a 200+ page book. This is the path that actually reads a scanned book whose
 * embedded text layer is empty.
 */
async function rasterizeAndOcrPdf(buffer: Buffer, usage?: UsageContext): Promise<string> {
  if (!openai) throw new Error('OPENAI_API_KEY is required for OCR');

  const info = await pdfParse(buffer).catch(() => null);
  const totalPages = Math.min(info?.numpages ?? 0, env.OCR_MAX_PAGES);
  if (totalPages <= 0) throw new Error('PDF has no rasterizable pages');

  const dir = await mkdtemp(join(tmpdir(), 'talim-ocr-'));
  const pdfPath = join(dir, 'in.pdf');
  await writeFile(pdfPath, buffer);
  const results: string[] = [];
  const batch = Math.max(1, env.OCR_CONCURRENCY);

  try {
    for (let start = 1; start <= totalPages; start += batch) {
      const end = Math.min(totalPages, start + batch - 1);
      await runPdftoppm(pdfPath, join(dir, 'p'), start, end, OCR_DPI);
      const files = (await readdir(dir)).filter((f) => f.startsWith('p-') && f.endsWith('.png'));
      // OCR the batch concurrently, then delete its page images.
      await Promise.all(
        files.map(async (file) => {
          const page = Number(file.match(/-(\d+)\.png$/)?.[1] ?? 0);
          const fp = join(dir, file);
          try {
            const png = await readFile(fp);
            const text = await ocrImageDataUrl(
              `data:image/png;base64,${png.toString('base64')}`,
              usage,
            );
            if (page > 0) results[page - 1] = text;
          } catch {
            /* skip a page that fails to OCR */
          } finally {
            await rm(fp, { force: true }).catch(() => {});
          }
        }),
      );
    }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }

  if ((info?.numpages ?? 0) > totalPages) {
    console.warn(
      `rasterizeAndOcrPdf: OCR'd first ${totalPages} of ${info?.numpages} pages (OCR_MAX_PAGES)`,
    );
  }

  return results
    .map((text, i) => (text && text.trim() ? `[${i + 1}] ${text.trim()}` : ''))
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Primary scanned-PDF OCR via Mistral's dedicated document OCR: upload the file,
 * OCR it server-side in one call, return ordered per-page text. A dedicated OCR
 * (not an LLM) is the correct choice for VERBATIM transcription — it won't
 * paraphrase or re-diacritize Arabic/Quranic verses the way LLM vision can.
 */
async function mistralOcrPdf(
  buffer: Buffer,
  filename: string,
  usage?: UsageContext,
): Promise<string> {
  const key = env.MISTRAL_API_KEY;
  if (!key) throw new Error('MISTRAL_API_KEY is not configured');
  const auth = { Authorization: `Bearer ${key}` };

  // 1) Upload the PDF to Mistral cloud (multipart).
  const form = new FormData();
  form.append('purpose', 'ocr');
  form.append('file', new Blob([new Uint8Array(buffer)], { type: 'application/pdf' }), filename);
  const upRes = await fetch(`${MISTRAL_API}/files`, { method: 'POST', headers: auth, body: form });
  if (!upRes.ok) throw new Error(`Mistral upload ${upRes.status}: ${await upRes.text()}`);
  const fileId = ((await upRes.json()) as { id: string }).id;

  try {
    // 2) Short-lived signed URL for the uploaded file.
    const urlRes = await fetch(`${MISTRAL_API}/files/${fileId}/url?expiry=24`, { headers: auth });
    if (!urlRes.ok) throw new Error(`Mistral signed-url ${urlRes.status}: ${await urlRes.text()}`);
    const signedUrl = ((await urlRes.json()) as { url: string }).url;

    // 3) OCR the whole document in one call.
    const ocrRes = await fetch(`${MISTRAL_API}/ocr`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: { type: 'document_url', document_url: signedUrl },
      }),
    });
    if (!ocrRes.ok) throw new Error(`Mistral OCR ${ocrRes.status}: ${await ocrRes.text()}`);
    const pages = ((await ocrRes.json()) as { pages?: { index: number; markdown: string }[] })
      .pages ?? [];

    if (usage) {
      recordUsage({
        userId: usage.userId,
        tenantId: usage.tenantId,
        feature: 'PDF_PARSE',
        model: 'mistral-ocr-latest',
        inputTokens: 0,
        outputTokens: 0,
        metadata: usage.metadata,
      });
    }
    return [...pages]
      .sort((a, b) => a.index - b.index)
      .map((p) => (p.markdown?.trim() ? `[${p.index + 1}] ${p.markdown.trim()}` : ''))
      .filter(Boolean)
      .join('\n\n');
  } finally {
    // Best-effort cleanup of the uploaded file.
    await fetch(`${MISTRAL_API}/files/${fileId}`, { method: 'DELETE', headers: auth }).catch(
      () => {},
    );
  }
}

export async function extractPdfText(
  buffer: Buffer,
  filename = 'document.pdf',
  usage?: UsageContext,
): Promise<string> {
  const parsed = await extractWithPdfParse(buffer);
  if (parsed) return parsed;

  // Scanned/image PDF (no text layer). Reliability ladder, best → last-resort:
  // 1) Mistral dedicated OCR (verbatim, off-box) when configured.
  if (env.MISTRAL_API_KEY) {
    try {
      const text = await mistralOcrPdf(buffer, filename, usage);
      if (text.trim()) return text;
    } catch (err) {
      console.warn('Mistral OCR failed, falling back to local OCR:', (err as Error)?.message);
    }
  }

  // 2) Local rasterize (pdftoppm) + per-page vision OCR.
  try {
    const ocr = await rasterizeAndOcrPdf(buffer, usage);
    if (ocr.trim()) return ocr;
  } catch (err) {
    console.warn('rasterizeAndOcrPdf failed, falling back to file OCR:', (err as Error)?.message);
  }

  // 3) Whole-file OpenAI vision (works for short scans only).
  return extractWithOpenAI(buffer, filename, usage);
}

const OCR_INSTRUCTION =
  'Transcribe the text in this image EXACTLY as written, character for character. Preserve the original language and script (Uzbek in Latin OR Cyrillic, Russian, Arabic, or English) and reading order. Do NOT translate, paraphrase, summarise, correct, or complete anything. For Arabic / Quranic text: transcribe verbatim and NEVER add or change diacritics (tashkeel) that are not clearly visible — never reconstruct a verse from memory. Write math formulas in LaTeX ($...$ inline, $$...$$ display). If the page has a meaningful illustration, diagram, chart, or table, add a short description of it in square brackets, e.g. [Rasm: ...]. Return plain text only — no introduction, commentary, or meta phrases (never write "Here is the text" or "No text could be parsed"). If a part is illegible or the page has no content, return an empty response rather than guessing.';

/** Vision OCR a single image (data URL). Reliable for scanned pages, unlike file-based OCR. */
async function ocrImageDataUrl(dataUrl: string, usage?: UsageContext): Promise<string> {
  if (!openai) {
    throw new Error('OPENAI_API_KEY is required for OCR');
  }
  const model = 'gpt-4o-mini';
  const response = await openai.chat.completions.create({
    model,
    temperature: 0, // deterministic, verbatim — no creative re-diacritization of verses
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
