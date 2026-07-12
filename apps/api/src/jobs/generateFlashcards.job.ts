import { parseAppLocale, type AppLocale } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { generateJsonCompletion } from '../services/ai.service.js';
import { flashcardQueue, type GenerateFlashcardsJobData } from '../services/queue.service.js';
import { jobEvents } from '../services/events/jobEvents.service.js';

interface GeneratedCard {
  front: string;
  back: string;
}

const TARGET_CARDS = 12;
const MAX_CARDS = 30;

// Flashcards are generated in the content's locale (Uzbek-first audience). Each prompt asks
// for a JSON array of {front, back} pairs: a short prompt/term on the front, a concise answer
// on the back. `count` is the requested card count from the unified Practice generator.
const PROMPTS: Record<AppLocale, { system: string; instruction: (count: number) => string }> = {
  uz: {
    system:
      "Siz o'quv materialidan sifatli fleshkartalar (flashcards) tayyorlovchi yordamchisiz. " +
      'Javobni faqat to\'g\'ri Uzbek tilida bering.',
    instruction: (count) =>
      `Quyidagi material asosida ${count} ta fleshkarta tayyorlang. Har bir karta ` +
      'qisqa savol yoki tushuncha (front) va aniq, ixcham javob (back) dan iborat bo\'lsin. ' +
      'Kartada materialdagi gap AYNAN ko\'chirilmasin — o\'z so\'zlaringiz bilan ifodalang. ' +
      'Javobni JSON ko\'rinishida bering: {"cards":[{"front":"...","back":"..."}]}. ' +
      'Faqat materialdagi ma\'lumotga tayaning.',
  },
  en: {
    system:
      'You create high-quality study flashcards from learning material. Respond in clear English.',
    instruction: (count) =>
      `Create ${count} flashcards from the material below. Each card has a short ` +
      'question or term (front) and a concise answer (back). Do not copy sentences verbatim — ' +
      'rephrase in your own words. Respond as JSON: ' +
      '{"cards":[{"front":"...","back":"..."}]}. Use only information from the material.',
  },
  ru: {
    system:
      'Вы создаёте качественные учебные карточки из материала. Отвечайте на чистом русском языке.',
    instruction: (count) =>
      `Создайте ${count} карточек на основе материала ниже. У каждой карточки короткий ` +
      'вопрос или термин (front) и краткий ответ (back). Не копируйте предложения дословно — ' +
      'переформулируйте своими словами. Ответ в формате JSON: ' +
      '{"cards":[{"front":"...","back":"..."}]}. Используйте только данные из материала.',
  },
};

export function registerGenerateFlashcardsJob(): void {
  flashcardQueue.process(async (job) => {
    const { contentId, deckId, locale: jobLocale, count: jobCount } = job.data as GenerateFlashcardsJobData;
    const locale = parseAppLocale(jobLocale);
    const targetCards = Math.min(Math.max(jobCount ?? TARGET_CARDS, 1), MAX_CARDS);

    const deck = await prisma.flashcardDeck.findUnique({ where: { id: deckId } });
    if (!deck) throw new Error(`Flashcard deck ${deckId} not found`);
    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) throw new Error(`Content ${contentId} not found`);

    const section = deck.sectionId
      ? await prisma.contentSection.findFirst({ where: { id: deck.sectionId, contentId } })
      : null;

    const chunks = await prisma.chunk.findMany({
      where: {
        contentId,
        ...(section ? { chunkIndex: { gte: section.startChunk, lte: section.endChunk } } : {}),
      },
      orderBy: { chunkIndex: 'asc' },
      take: 25,
    });
    const context = chunks
      .map((c) => c.text)
      .join('\n\n')
      .slice(0, 8000);
    if (!context.trim()) throw new Error('No content available to build flashcards from');

    const prompt = PROMPTS[locale];
    const result = await generateJsonCompletion<{ cards: GeneratedCard[] }>(
      [
        { role: 'system', content: prompt.system },
        { role: 'user', content: `${prompt.instruction(targetCards)}\n\n---\n${context}` },
      ],
      {
        // Metered under SUMMARY_GEN until a dedicated FLASHCARD_GEN usage feature exists.
        usage: {
          userId: content.userId,
          tenantId: content.tenantId ?? undefined,
          feature: 'SUMMARY_GEN',
          metadata: { contentId, deckId },
        },
        temperature: 0.5,
      },
    );

    const cards = (result.cards ?? [])
      .filter(
        (c): c is GeneratedCard =>
          !!c &&
          typeof c.front === 'string' &&
          typeof c.back === 'string' &&
          c.front.trim().length > 0 &&
          c.back.trim().length > 0,
      )
      .slice(0, targetCards);

    if (cards.length === 0) {
      await prisma.flashcardDeck.update({ where: { id: deckId }, data: { status: 'FAILED' } });
      jobEvents.publish(content.userId, {
        type: 'flashcards.status',
        contentId,
        sectionId: deck.sectionId ?? undefined,
        status: 'FAILED',
      });
      return;
    }

    await prisma.$transaction([
      prisma.flashcard.deleteMany({ where: { deckId } }),
      prisma.flashcard.createMany({
        data: cards.map((c, index) => ({
          deckId,
          front: c.front.trim(),
          back: c.back.trim(),
          order: index,
        })),
      }),
      prisma.flashcardDeck.update({ where: { id: deckId }, data: { status: 'READY' } }),
    ]);

    jobEvents.publish(content.userId, {
      type: 'flashcards.status',
      contentId,
      sectionId: deck.sectionId ?? undefined,
      status: 'READY',
    });
  });

  flashcardQueue.on('failed', async (job, err) => {
    console.error(`Flashcards job ${job?.id} failed:`, err.message);
    const data = job?.data as GenerateFlashcardsJobData | undefined;
    if (!data?.deckId) return;
    const deck = await prisma.flashcardDeck
      .update({ where: { id: data.deckId }, data: { status: 'FAILED' } })
      .catch(() => null);
    const owner = await prisma.content.findUnique({
      where: { id: data.contentId },
      select: { userId: true },
    });
    if (owner) {
      jobEvents.publish(owner.userId, {
        type: 'flashcards.status',
        contentId: data.contentId,
        sectionId: deck?.sectionId ?? undefined,
        status: 'FAILED',
      });
    }
  });
}
