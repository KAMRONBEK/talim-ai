import { prisma } from '../lib/prisma.js';
import { generateJsonCompletion } from './ai.service.js';
import { SECTION_SYSTEM_PROMPT, buildSectionUserPrompt } from '../lib/section-prompt.js';

interface GeneratedSection {
  title: string;
  startChunk: number;
  endChunk: number;
  readMinutes?: number;
}

export async function generateContentSections(contentId: string, chunkCount: number): Promise<void> {
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
    const result = await generateJsonCompletion<{ sections: GeneratedSection[] }>([
      { role: 'system', content: SECTION_SYSTEM_PROMPT },
      { role: 'user', content: buildSectionUserPrompt(chunkCount, preview) },
    ]);

    const sections = (result.sections ?? []).slice(0, 12);
    if (sections.length === 0) throw new Error('No sections');

    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      if (!s) continue;
      const start = Math.max(0, Math.min(s.startChunk, chunkCount - 1));
      const end = Math.max(start, Math.min(s.endChunk, chunkCount - 1));
      await prisma.contentSection.create({
        data: {
          contentId,
          title: s.title,
          order: i,
          startChunk: start,
          endChunk: end,
          readMinutes: s.readMinutes ?? Math.max(3, end - start + 2),
        },
      });
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
