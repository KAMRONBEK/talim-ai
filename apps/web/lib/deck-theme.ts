import type { DeckAccent, DeckIcon, DeckSlide } from '@talim/types';
import {
  AlertTriangle,
  Beaker,
  BookOpen,
  Brain,
  Calculator,
  CheckCircle2,
  CircleDot,
  Clock,
  Flag,
  Flame,
  Globe,
  Leaf,
  Lightbulb,
  Puzzle,
  Rocket,
  Scale,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/** Solid accent hex per accent name (drives the `--slide-accent` CSS variable). */
export const ACCENT_HEX: Record<DeckAccent, string> = {
  teal: '#14B8A6',
  indigo: '#6366F1',
  violet: '#8B5CF6',
  coral: '#FB7185',
  amber: '#F59E0B',
  sky: '#0EA5E9',
  emerald: '#10B981',
  fuchsia: '#D946EF',
};

export interface DeckPalette {
  /** Accents cycled across slides when a slide has no explicit accent. */
  accents: DeckAccent[];
  canvasLight: string;
  canvasDark: string;
  hero: string;
}

export const DECK_PALETTES = {
  aurora: {
    accents: ['teal', 'indigo', 'violet'],
    canvasLight: 'bg-[linear-gradient(135deg,#ECFEFF_0%,#EEF2FF_55%,#F5F3FF_100%)]',
    canvasDark: 'dark:bg-[linear-gradient(135deg,#0B1220_0%,#0E1A2B_55%,#160E2B_100%)]',
    hero: 'bg-[linear-gradient(135deg,#0D9488_0%,#4F46E5_60%,#7C3AED_100%)]',
  },
  sunrise: {
    accents: ['coral', 'amber', 'violet'],
    canvasLight: 'bg-[linear-gradient(135deg,#FFF1F2_0%,#FFF7ED_60%,#FEFCE8_100%)]',
    canvasDark: 'dark:bg-[linear-gradient(135deg,#1C1012_0%,#241405_100%)]',
    hero: 'bg-[linear-gradient(120deg,#F43F5E_0%,#FB923C_55%,#F59E0B_100%)]',
  },
  ocean: {
    accents: ['sky', 'emerald', 'teal'],
    canvasLight: 'bg-[linear-gradient(135deg,#F0F9FF_0%,#ECFEFF_100%)]',
    canvasDark: 'dark:bg-[linear-gradient(135deg,#0A1424_0%,#06141C_100%)]',
    hero: 'bg-[linear-gradient(120deg,#0284C7_0%,#06B6D4_100%)]',
  },
  galaxy: {
    accents: ['fuchsia', 'violet', 'indigo'],
    canvasLight: 'bg-[linear-gradient(135deg,#FAF5FF_0%,#FDF2F8_100%)]',
    canvasDark: 'dark:bg-[linear-gradient(135deg,#140A24_0%,#1E0A2B_100%)]',
    hero: 'bg-[linear-gradient(120deg,#9333EA_0%,#DB2777_100%)]',
  },
} as const satisfies Record<string, DeckPalette>;

export type PaletteName = keyof typeof DECK_PALETTES;

export const ACCENT_TO_PALETTE: Record<DeckAccent, PaletteName> = {
  teal: 'aurora',
  indigo: 'aurora',
  violet: 'aurora',
  coral: 'sunrise',
  amber: 'sunrise',
  sky: 'ocean',
  emerald: 'ocean',
  fuchsia: 'galaxy',
};

export function paletteFor(accent: DeckAccent): DeckPalette {
  return DECK_PALETTES[ACCENT_TO_PALETTE[accent]];
}

/** Per-slide accent: explicit override, else cycle the deck palette's accents. */
export function resolveSlideAccentHex(deckAccent: DeckAccent, slide: DeckSlide, index: number): string {
  if (slide.accent) return ACCENT_HEX[slide.accent];
  const palette = paletteFor(deckAccent);
  const cycled = palette.accents[index % palette.accents.length] ?? deckAccent;
  return ACCENT_HEX[cycled];
}

const ICONS: Record<DeckIcon, LucideIcon> = {
  lightbulb: Lightbulb,
  'alert-triangle': AlertTriangle,
  'check-circle': CheckCircle2,
  'book-open': BookOpen,
  target: Target,
  zap: Zap,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  beaker: Beaker,
  calculator: Calculator,
  globe: Globe,
  clock: Clock,
  star: Star,
  flag: Flag,
  puzzle: Puzzle,
  rocket: Rocket,
  brain: Brain,
  flame: Flame,
  leaf: Leaf,
  scale: Scale,
};

export function deckIcon(name?: DeckIcon): LucideIcon {
  return (name && ICONS[name]) || CircleDot;
}

/** Reusable Tailwind class-string tokens for slide layouts. */
export const T = {
  slideRoot:
    'relative flex h-full w-full flex-col overflow-hidden rounded-[2rem] p-14 text-zinc-900 dark:text-zinc-100',
  surface:
    'rounded-3xl border border-white/60 bg-white/80 shadow-xl shadow-black/5 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/70 dark:shadow-black/40',
  kicker:
    'inline-flex items-center gap-1.5 rounded-full bg-[color:var(--slide-accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--slide-accent)]',
  accentRule: 'mt-4 h-1.5 w-16 rounded-full bg-[var(--slide-accent)]',
  iconChip:
    'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--slide-accent)]/15 ring-1 ring-inset ring-[color:var(--slide-accent)]/25',
  iconInChip: 'h-6 w-6 text-[color:var(--slide-accent)]',
  title: 'font-bold tracking-tight leading-[1.1]',
  blobTopRight:
    'pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[var(--slide-accent)] opacity-20 blur-3xl dark:opacity-25',
  blobBotLeft:
    'pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-fuchsia-400 opacity-15 blur-3xl dark:opacity-20',
  dotTexture:
    'pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)]',
};
