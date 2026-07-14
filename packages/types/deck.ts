import type { MermaidPayload, ChartPayload } from './tutor-visual';

/** Accent families an AI-generated slide deck can use. Maps to a palette in the web app. */
export type DeckAccent =
  | 'teal'
  | 'indigo'
  | 'violet'
  | 'coral'
  | 'amber'
  | 'sky'
  | 'emerald'
  | 'fuchsia';

/** Closed icon set the LLM may reference; the renderer falls back gracefully on unknowns. */
export type DeckIcon =
  | 'lightbulb'
  | 'alert-triangle'
  | 'check-circle'
  | 'book-open'
  | 'target'
  | 'zap'
  | 'trending-up'
  | 'trending-down'
  | 'beaker'
  | 'calculator'
  | 'globe'
  | 'clock'
  | 'star'
  | 'flag'
  | 'puzzle'
  | 'rocket'
  | 'brain'
  | 'flame'
  | 'leaf'
  | 'scale';

export type SlideLayout =
  | 'cover'
  | 'section'
  | 'concept'
  | 'bullets'
  | 'twoColumn'
  | 'bigStat'
  | 'statTrio'
  | 'quote'
  | 'definition'
  | 'comparison'
  | 'process'
  | 'diagram'
  | 'chart'
  | 'callout'
  | 'recap'
  | 'quickCheck';

export interface SlideBase {
  /** Unique within the deck, e.g. "s3-photosynthesis". Used as the React key + nav anchor. */
  id: string;
  layout: SlideLayout;
  /** Optional per-slide accent; otherwise the renderer cycles the deck accent family. */
  accent?: DeckAccent;
  /** Speaker/tutor notes — never rendered on the slide surface. */
  notes?: string;
  /** Chunk/section ids (or short quoted anchors) the slide was derived from. */
  sourceRefs?: string[];
}

export interface DeckBullet {
  text: string;
  icon?: DeckIcon;
  sub?: string;
}

export interface CoverSlide extends SlideBase {
  layout: 'cover';
  title: string;
  subtitle?: string;
  kicker?: string;
  estimatedMinutes?: number;
}

export interface SectionSlide extends SlideBase {
  layout: 'section';
  title: string;
  subtitle?: string;
  index?: string;
}

export interface ConceptSlide extends SlideBase {
  layout: 'concept';
  title: string;
  body?: string;
  icon?: DeckIcon;
}

export interface BulletsSlide extends SlideBase {
  layout: 'bullets';
  title: string;
  columns?: 1 | 2;
  bullets: DeckBullet[];
}

export interface TwoColumnSlide extends SlideBase {
  layout: 'twoColumn';
  title: string;
  ratio?: '1-1' | '1-2' | '2-1';
  left: { heading?: string; markdown: string };
  right: { heading?: string; markdown: string };
}

export interface BigStatSlide extends SlideBase {
  layout: 'bigStat';
  value: string;
  label: string;
  context?: string;
  trend?: 'up' | 'down' | 'flat';
}

export interface StatTrioSlide extends SlideBase {
  layout: 'statTrio';
  title?: string;
  stats: { value: string; label: string }[];
}

export interface QuoteSlide extends SlideBase {
  layout: 'quote';
  quote: string;
  attribution?: string;
  source?: string;
}

export interface DefinitionSlide extends SlideBase {
  layout: 'definition';
  term: string;
  definition: string;
  example?: string;
  pronunciation?: string;
}

export interface ComparisonSlide extends SlideBase {
  layout: 'comparison';
  title: string;
  kind: 'prosCons' | 'vsTable';
  a: { heading: string; items: string[] };
  b: { heading: string; items: string[] };
}

export interface ProcessSlide extends SlideBase {
  layout: 'process';
  title: string;
  orientation?: 'vertical' | 'horizontal';
  steps: { title: string; detail?: string; icon?: DeckIcon }[];
}

export interface DiagramSlide extends SlideBase {
  layout: 'diagram';
  title?: string;
  caption?: string;
  mermaid: MermaidPayload;
}

export interface ChartSlide extends SlideBase {
  layout: 'chart';
  title?: string;
  caption?: string;
  chart: ChartPayload;
}

export interface CalloutSlide extends SlideBase {
  layout: 'callout';
  variant: 'tip' | 'warning' | 'note' | 'key' | 'example';
  title?: string;
  markdown: string;
}

export interface RecapSlide extends SlideBase {
  layout: 'recap';
  title: string;
  points: string[];
}

export interface QuickCheckSlide extends SlideBase {
  layout: 'quickCheck';
  question: string;
  kind: 'mcq' | 'trueFalse' | 'open';
  options?: { text: string; correct: boolean }[];
  answerExplanation?: string;
}

export type DeckSlide =
  | CoverSlide
  | SectionSlide
  | ConceptSlide
  | BulletsSlide
  | TwoColumnSlide
  | BigStatSlide
  | StatTrioSlide
  | QuoteSlide
  | DefinitionSlide
  | ComparisonSlide
  | ProcessSlide
  | DiagramSlide
  | ChartSlide
  | CalloutSlide
  | RecapSlide
  | QuickCheckSlide;

export type DeckAudience = 'kids' | 'students' | 'tutors';

export interface Deck {
  schemaVersion: '1';
  title: string;
  subtitle?: string;
  audience: DeckAudience;
  accent: DeckAccent;
  language: 'uz' | 'en' | 'ru';
  estimatedMinutes: number;
  sourceContentId: string;
  slides: DeckSlide[];
}

export type SlideDeckStatus = 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';

/** API response shape for a generated deck. */
export interface ContentSlideDeck {
  id: string;
  contentId: string;
  sectionId: string | null;
  scopeKey: string;
  locale: string;
  status: SlideDeckStatus;
  deck: Deck | null;
  createdAt: string;
}
