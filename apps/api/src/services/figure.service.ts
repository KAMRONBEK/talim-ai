import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { generateEmbeddings, embeddingToSql } from './embed.service.js';
import { recordUsage, type UsageContext } from './usage.service.js';

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
const VISION_MODEL = 'gpt-4o';
const MAX_PAGES = 30; // bound cost on very large documents
const CONCURRENCY = 4;

const FIGURE_PROMPT = `You extract MEANINGFUL figures from one page of a learning document: diagrams, charts/graphs, tables, maps, geometric figures, labeled illustrations, and important equations shown as images. IGNORE decorative images, logos, page headers/footers, and plain body text.
For each meaningful figure, write a detailed caption (1-3 sentences) describing exactly what it shows — its type, the data/labels/axes/relationships, and the concept it teaches — so a student could understand the figure from the caption alone. Preserve the source language (Uzbek/Russian/English). If the page has no meaningful figure, return an empty list.
Return JSON only: { "figures": [ { "caption": "..." } ] }`;

async function captionPage(dataUrl: string, usage?: UsageContext): Promise<string[]> {
  if (!openai) return [];
  const res = await openai.chat.completions.create({
    model: VISION_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl } },
          { type: 'text', text: FIGURE_PROMPT },
        ],
      },
    ],
    response_format: { type: 'json_object' },
  });
  if (usage) {
    recordUsage({
      userId: usage.userId,
      tenantId: usage.tenantId,
      feature: 'PDF_PARSE',
      model: VISION_MODEL,
      inputTokens: res.usage?.prompt_tokens ?? 0,
      outputTokens: res.usage?.completion_tokens ?? 0,
      metadata: { ...usage.metadata, figures: true },
    });
  }
  try {
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? '{}') as {
      figures?: { caption?: string }[];
    };
    return (parsed.figures ?? [])
      .map((f) => (f.caption ?? '').trim())
      .filter((c) => c.length > 10);
  } catch {
    return [];
  }
}

/**
 * Caption the meaningful figures on each page image with a vision model, embed the
 * captions, and store them as ContentFigure rows so figures are retrievable
 * alongside text chunks. Best-effort: requires page images (the rasterized-page
 * ingest path) and OPENAI_API_KEY; returns 0 when unavailable.
 */
export async function captionAndStoreFigures(
  contentId: string,
  pageImages: string[],
  usage?: UsageContext,
): Promise<number> {
  if (!openai || pageImages.length === 0) return 0;

  const pages = pageImages.slice(0, MAX_PAGES);
  const captions: { page: number; caption: string }[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < pages.length) {
      const i = cursor++;
      const img = pages[i];
      if (!img) continue;
      const dataUrl = img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`;
      const caps = await captionPage(dataUrl, usage).catch(() => [] as string[]);
      for (const c of caps) captions.push({ page: i + 1, caption: c });
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pages.length) }, () => worker()));

  await prisma.$executeRaw`DELETE FROM "ContentFigure" WHERE "contentId" = ${contentId}`;
  if (captions.length === 0) return 0;

  const embeddings = await generateEmbeddings(
    captions.map((c) => c.caption),
    usage ? { ...usage, metadata: { ...usage.metadata, figures: true } } : undefined,
  );
  for (let i = 0; i < captions.length; i++) {
    const item = captions[i];
    const emb = embeddings[i];
    if (!item || !emb) continue;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ContentFigure" ("id", "contentId", "page", "caption", "embedding")
       VALUES ($1, $2, $3, $4, $5::vector)`,
      randomUUID(),
      contentId,
      item.page,
      item.caption,
      embeddingToSql(emb),
    );
  }
  return captions.length;
}
