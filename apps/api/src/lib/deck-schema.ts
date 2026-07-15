import { z } from 'zod';
import type { Deck, DeckSlide } from '@talim/types';

const MAX_MERMAID = 4000;
const MERMAID_DENY = /<script|javascript:|on\w+=/i;

const accentEnum = z.enum([
  'teal',
  'indigo',
  'violet',
  'coral',
  'amber',
  'sky',
  'emerald',
  'fuchsia',
]);
const iconEnum = z.enum([
  'lightbulb',
  'alert-triangle',
  'check-circle',
  'book-open',
  'target',
  'zap',
  'trending-up',
  'trending-down',
  'beaker',
  'calculator',
  'globe',
  'clock',
  'star',
  'flag',
  'puzzle',
  'rocket',
  'brain',
  'flame',
  'leaf',
  'scale',
]);

const mermaidSchema = z.object({
  diagram: z
    .string()
    .min(1)
    .max(MAX_MERMAID)
    .refine((d) => !MERMAID_DENY.test(d), 'unsafe diagram'),
  title: z.string().max(120).optional(),
});

const chartSchema = z
  .object({
    type: z.enum(['bar', 'line', 'area']),
    title: z.string().max(120).optional(),
    labels: z.array(z.string().max(64)).min(1).max(20),
    series: z
      .array(
        z.object({
          name: z.string().min(1).max(64),
          data: z.array(z.number().finite()).min(1).max(20),
        }),
      )
      .min(1)
      .max(4),
    xLabel: z.string().max(64).optional(),
    yLabel: z.string().max(64).optional(),
  })
  .refine(
    (c) => c.series.every((s) => s.data.length === c.labels.length),
    'series length must match labels',
  );

const base = {
  id: z.string().min(1).max(60),
  accent: accentEnum.optional(),
  notes: z.string().max(1200).optional(),
  sourceRefs: z.array(z.string().max(120)).max(8).optional(),
};
const TITLE = z.string().min(1).max(120);
const BODY = z.string().max(320);
const bullet = z.object({
  text: z.string().max(120),
  icon: iconEnum.optional(),
  sub: z.string().max(120).optional(),
});

export const slideSchema = z.discriminatedUnion('layout', [
  z.object({
    ...base,
    layout: z.literal('cover'),
    title: TITLE,
    subtitle: z.string().max(160).optional(),
    kicker: z.string().max(60).optional(),
    estimatedMinutes: z.number().int().min(1).max(90).optional(),
  }),
  z.object({
    ...base,
    layout: z.literal('section'),
    title: TITLE,
    subtitle: z.string().max(160).optional(),
    index: z.string().max(4).optional(),
  }),
  z.object({
    ...base,
    layout: z.literal('concept'),
    title: TITLE,
    body: BODY.optional(),
    icon: iconEnum.optional(),
  }),
  z.object({
    ...base,
    layout: z.literal('bullets'),
    title: TITLE,
    columns: z.union([z.literal(1), z.literal(2)]).optional(),
    bullets: z.array(bullet).min(2).max(6),
  }),
  z.object({
    ...base,
    layout: z.literal('twoColumn'),
    title: TITLE,
    ratio: z.enum(['1-1', '1-2', '2-1']).optional(),
    left: z.object({ heading: z.string().max(80).optional(), markdown: BODY }),
    right: z.object({ heading: z.string().max(80).optional(), markdown: BODY }),
  }),
  z.object({
    ...base,
    layout: z.literal('bigStat'),
    value: z.string().max(24),
    label: z.string().max(120),
    context: z.string().max(180).optional(),
    trend: z.enum(['up', 'down', 'flat']).optional(),
  }),
  z.object({
    ...base,
    layout: z.literal('statTrio'),
    title: TITLE.optional(),
    stats: z
      .array(z.object({ value: z.string().max(24), label: z.string().max(80) }))
      .min(2)
      .max(3),
  }),
  z.object({
    ...base,
    layout: z.literal('quote'),
    quote: z.string().max(280),
    attribution: z.string().max(100).optional(),
    source: z.string().max(100).optional(),
  }),
  z.object({
    ...base,
    layout: z.literal('definition'),
    term: z.string().max(80),
    definition: z.string().max(320),
    example: z.string().max(200).optional(),
    pronunciation: z.string().max(80).optional(),
  }),
  z.object({
    ...base,
    layout: z.literal('comparison'),
    title: TITLE,
    kind: z.enum(['prosCons', 'vsTable']),
    a: z.object({ heading: z.string().max(60), items: z.array(z.string().max(120)).min(2).max(5) }),
    b: z.object({ heading: z.string().max(60), items: z.array(z.string().max(120)).min(2).max(5) }),
  }),
  z.object({
    ...base,
    layout: z.literal('process'),
    title: TITLE,
    orientation: z.enum(['vertical', 'horizontal']).optional(),
    steps: z
      .array(
        z.object({
          title: z.string().max(80),
          detail: z.string().max(160).optional(),
          icon: iconEnum.optional(),
        }),
      )
      .min(2)
      .max(6),
  }),
  z.object({
    ...base,
    layout: z.literal('diagram'),
    title: z.string().max(120).optional(),
    caption: z.string().max(180).optional(),
    mermaid: mermaidSchema,
  }),
  z.object({
    ...base,
    layout: z.literal('chart'),
    title: z.string().max(120).optional(),
    caption: z.string().max(180).optional(),
    chart: chartSchema,
  }),
  z.object({
    ...base,
    layout: z.literal('callout'),
    variant: z.enum(['tip', 'warning', 'note', 'key', 'example']),
    title: z.string().max(80).optional(),
    markdown: BODY,
  }),
  z.object({
    ...base,
    layout: z.literal('recap'),
    title: TITLE,
    points: z.array(z.string().max(160)).min(2).max(6),
  }),
  z.object({
    ...base,
    layout: z.literal('quickCheck'),
    question: z.string().max(200),
    kind: z.enum(['mcq', 'trueFalse', 'open']),
    options: z
      .array(z.object({ text: z.string().max(160), correct: z.boolean() }))
      .min(2)
      .max(4)
      .optional(),
    answerExplanation: z.string().max(280).optional(),
  }),
]);

export const deckSchema = z.object({
  schemaVersion: z.literal('1'),
  title: z.string().min(1).max(120),
  subtitle: z.string().max(160).optional(),
  audience: z.enum(['kids', 'students', 'tutors']),
  accent: accentEnum,
  language: z.enum(['uz', 'en', 'ru']),
  estimatedMinutes: z.number().int().min(1).max(90),
  sourceContentId: z.string(),
  slides: z.array(slideSchema).min(4).max(30),
});

type ParsedDeck = z.infer<typeof deckSchema>;
type ParsedSlide = z.infer<typeof slideSchema>;

// Compile-time guarantee that the zod schema stays assignable to the shared TS types.
const _deckAssign: Deck = {} as ParsedDeck;
const _slideAssign: DeckSlide = {} as ParsedSlide;
void _deckAssign;
void _slideAssign;
