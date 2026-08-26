import { prisma } from '../lib/prisma.js';

/** Generated artifacts that exist for one content in one locale. */
export interface LocaleGenerations {
  locale: string;
  quizzes: number;
  podcasts: number;
  videos: number;
  flashcards: number;
  slides: number;
  summaries: number;
  total: number;
}

/**
 * Which OTHER locales already have generated material for this content.
 *
 * Every generated artifact is keyed by locale, deliberately: a Russian podcast genuinely is a
 * different artifact from an Uzbek one, because the content is in that language. The problem was
 * never the scoping — it was that nothing said so. Switch the app to Russian and the quiz list is
 * simply empty, which reads as "my quizzes were deleted", and the natural response is to
 * regenerate — spending quota to recreate something that already exists in the other language.
 *
 * Telling the user the other-language material is there turns a silent gap into a choice.
 */
export async function getOtherLocaleGenerations(
  contentId: string,
  currentLocale: string,
): Promise<LocaleGenerations[]> {
  const [quizzes, podcasts, videos, flashcards, slides, summaries] = await Promise.all([
    prisma.quiz.groupBy({ by: ['locale'], where: { contentId }, _count: { _all: true } }),
    prisma.podcast.groupBy({ by: ['locale'], where: { contentId }, _count: { _all: true } }),
    prisma.contentVideo.groupBy({ by: ['locale'], where: { contentId }, _count: { _all: true } }),
    prisma.flashcardDeck.groupBy({ by: ['locale'], where: { contentId }, _count: { _all: true } }),
    prisma.contentSlideDeck.groupBy({ by: ['locale'], where: { contentId }, _count: { _all: true } }),
    prisma.contentSummary.groupBy({ by: ['locale'], where: { contentId }, _count: { _all: true } }),
  ]);

  const byLocale = new Map<string, LocaleGenerations>();
  const add = (
    rows: { locale: string; _count: { _all: number } }[],
    key: keyof Omit<LocaleGenerations, 'locale' | 'total'>,
  ) => {
    for (const row of rows) {
      if (row.locale === currentLocale) continue;
      const entry =
        byLocale.get(row.locale) ??
        {
          locale: row.locale,
          quizzes: 0,
          podcasts: 0,
          videos: 0,
          flashcards: 0,
          slides: 0,
          summaries: 0,
          total: 0,
        };
      entry[key] += row._count._all;
      entry.total += row._count._all;
      byLocale.set(row.locale, entry);
    }
  };

  add(quizzes, 'quizzes');
  add(podcasts, 'podcasts');
  add(videos, 'videos');
  add(flashcards, 'flashcards');
  add(slides, 'slides');
  add(summaries, 'summaries');

  return [...byLocale.values()].filter((e) => e.total > 0).sort((a, b) => b.total - a.total);
}
