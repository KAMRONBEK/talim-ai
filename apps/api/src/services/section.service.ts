import type { AppLocale } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { generateJsonCompletion } from './ai.service.js';
import { SECTION_SYSTEM_PROMPT, buildSectionUserPrompt } from '../lib/section-prompt.js';

const SECTION_TITLE_LOCALE_PROMPT: Record<AppLocale, string> = {
  uz: '',
  en: `Translate section titles into clear English. Keep titles short (under 60 characters). Return JSON only.`,
  ru: `Переведите названия разделов на русский язык. Краткие заголовки (до 60 символов). Только JSON.`,
};

interface SectionTitleInput {
  id: string;
  title: string;
  order: number;
}

interface GeneratedSubsection {
  title: string;
  startChunk: number;
  endChunk: number;
  readMinutes?: number;
}

interface GeneratedSection {
  title: string;
  startChunk: number;
  endChunk: number;
  readMinutes?: number;
  /** Optional shallow (2-level) outline: children of this chapter. */
  subsections?: GeneratedSubsection[];
}

export async function generateContentSections(contentId: string, chunkCount: number): Promise<void> {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { userId: true },
  });
  const userId = content?.userId;

  await prisma.contentSection.deleteMany({ where: { contentId } });

  if (chunkCount === 0) return;

  if (chunkCount <= 3) {
    await prisma.contentSection.create({
      data: {
        contentId,
        title: "To'liq material",
        order: 0,
        startChunk: 0,
        endChunk: chunkCount - 1,
        readMinutes: Math.max(5, Math.ceil(chunkCount / 2)),
      },
    });
    return;
  }

  const chunks = await prisma.chunk.findMany({
    where: { contentId },
    orderBy: { chunkIndex: 'asc' },
    select: { chunkIndex: true, text: true },
  });

  const preview = chunks
    .filter((_, i) => i % Math.max(1, Math.floor(chunks.length / 8)) === 0)
    .map((c) => `[${c.chunkIndex}] ${c.text.slice(0, 200)}`)
    .join('\n\n');

  try {
    const result = await generateJsonCompletion<{ sections: GeneratedSection[] }>(
      [
        { role: 'system', content: SECTION_SYSTEM_PROMPT },
        { role: 'user', content: buildSectionUserPrompt(chunkCount, preview) },
      ],
      userId
        ? {
            usage: {
              userId,
              feature: 'SECTION_GEN',
              metadata: { contentId },
            },
          }
        : undefined,
    );

    const sections = (result.sections ?? []).slice(0, 12);
    if (sections.length === 0) throw new Error('No sections');

    // Single global order that increments in traversal order (parent, then its
    // children, then the next parent…) so a flat sort by `order` still yields the
    // correct reading order. Chapters without subsections behave exactly as before
    // (depth 0, parentId null).
    let order = 0;
    for (const s of sections) {
      if (!s) continue;
      const start = Math.max(0, Math.min(s.startChunk, chunkCount - 1));
      const end = Math.max(start, Math.min(s.endChunk, chunkCount - 1));
      const parent = await prisma.contentSection.create({
        data: {
          contentId,
          parentId: null,
          depth: 0,
          title: s.title,
          order,
          startChunk: start,
          endChunk: end,
          readMinutes: s.readMinutes ?? Math.max(3, end - start + 2),
        },
      });
      order++;

      for (const sub of s.subsections ?? []) {
        if (!sub) continue;
        const subStart = Math.max(0, Math.min(sub.startChunk, chunkCount - 1));
        const subEnd = Math.max(subStart, Math.min(sub.endChunk, chunkCount - 1));
        await prisma.contentSection.create({
          data: {
            contentId,
            parentId: parent.id,
            depth: 1,
            title: sub.title,
            order,
            startChunk: subStart,
            endChunk: subEnd,
            readMinutes: sub.readMinutes ?? Math.max(3, subEnd - subStart + 2),
          },
        });
        order++;
      }
    }
  } catch {
    const perSection = Math.max(2, Math.ceil(chunkCount / 6));
    let order = 0;
    for (let start = 0; start < chunkCount; start += perSection) {
      const end = Math.min(chunkCount - 1, start + perSection - 1);
      await prisma.contentSection.create({
        data: {
          contentId,
          title: `Bo'lim ${order + 1}`,
          order,
          startChunk: start,
          endChunk: end,
          readMinutes: Math.max(3, end - start + 2),
        },
      });
      order++;
    }
  }
}

async function translateSectionTitles(
  sections: SectionTitleInput[],
  locale: AppLocale,
): Promise<Record<string, string>> {
  const titles = sections.map((s) => ({ id: s.id, title: s.title }));
  const result = await generateJsonCompletion<{ titles: { id: string; title: string }[] }>([
    { role: 'system', content: SECTION_TITLE_LOCALE_PROMPT[locale] },
    {
      role: 'user',
      content: `Translate these section titles:\n${JSON.stringify(titles, null, 2)}\n\nReturn JSON: { "titles": [{ "id": "...", "title": "..." }] }`,
    },
  ]);

  const map: Record<string, string> = {};
  for (const item of result.titles ?? []) {
    if (item.id && item.title) map[item.id] = item.title;
  }
  return map;
}

export async function ensureSectionTitlesForLocale(
  contentId: string,
  locale: AppLocale,
): Promise<void> {
  if (locale === 'uz') return;

  const sections = await prisma.contentSection.findMany({
    where: { contentId },
    orderBy: { order: 'asc' },
    select: { id: true, title: true, order: true },
  });
  if (sections.length === 0) return;

  const existing = await prisma.contentSectionTitle.findMany({
    where: { sectionId: { in: sections.map((s) => s.id) }, locale },
  });
  if (existing.length === sections.length) return;

  const translated = await translateSectionTitles(sections, locale);

  for (const section of sections) {
    const title = translated[section.id] ?? section.title;
    await prisma.contentSectionTitle.upsert({
      where: { sectionId_locale: { sectionId: section.id, locale } },
      create: { sectionId: section.id, locale, title },
      update: { title },
    });
  }
}

export async function resolveSectionTitle(
  section: { id: string; title: string },
  locale: AppLocale,
): Promise<string> {
  if (locale === 'uz') return section.title;

  const localized = await prisma.contentSectionTitle.findUnique({
    where: { sectionId_locale: { sectionId: section.id, locale } },
  });
  return localized?.title ?? section.title;
}

export async function getSectionBody(contentId: string, sectionId: string): Promise<string> {
  const section = await prisma.contentSection.findFirst({
    where: { id: sectionId, contentId },
  });
  if (!section) throw new Error('Section not found');

  const chunks = await prisma.chunk.findMany({
    where: {
      contentId,
      chunkIndex: { gte: section.startChunk, lte: section.endChunk },
    },
    orderBy: { chunkIndex: 'asc' },
  });

  return chunks.map((c) => c.text).join('\n\n');
}
