'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Minus, Quote as QuoteIcon, TrendingDown, TrendingUp, X } from 'lucide-react';
import { cn } from '@talim/ui';
import type {
  DeckAccent,
  DeckSlide,
  BulletsSlide,
  CalloutSlide,
  ChartSlide,
  ComparisonSlide,
  ConceptSlide,
  CoverSlide,
  DefinitionSlide,
  DiagramSlide,
  BigStatSlide,
  ProcessSlide,
  QuickCheckSlide,
  QuoteSlide,
  RecapSlide,
  SectionSlide,
  StatTrioSlide,
  TwoColumnSlide,
} from '@talim/types';
import { MermaidDiagram } from '@/components/chat/MermaidDiagram';
import { TutorChart } from '@/components/chat/TutorChart';
import { T, deckIcon, paletteFor, resolveSlideAccentHex } from '@/lib/deck-theme';
import { DeckMarkdown } from './DeckMarkdown';

const fadeUp = 'motion-safe:animate-deck-fade-in-up';

function Kicker({ children }: { children: React.ReactNode }) {
  return <span className={T.kicker}>{children}</span>;
}

function SlideTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn(T.title, 'text-[2.5rem]', className)}>{children}</h2>;
}

/* ---------- layout renderers ---------- */

function Cover({ slide }: { slide: CoverSlide }) {
  const palette = paletteFor(slide.accent ?? 'teal');
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col justify-center rounded-[2rem] p-16 text-white',
        palette.hero,
      )}
    >
      <div className={cn('pointer-events-none absolute inset-0 opacity-25', T.dotTexture)} />
      <div className="relative">
        {slide.kicker && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
            {slide.kicker}
          </span>
        )}
        <h1 className={cn(T.title, 'mt-5 max-w-[20ch] text-[3.5rem] font-extrabold drop-shadow-sm')}>
          {slide.title}
        </h1>
        {slide.subtitle && <p className="mt-5 max-w-[42ch] text-2xl text-white/90">{slide.subtitle}</p>}
        {slide.estimatedMinutes != null && (
          <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
            ⏱ {slide.estimatedMinutes} min
          </span>
        )}
      </div>
    </div>
  );
}

function Section({ slide }: { slide: SectionSlide }) {
  const palette = paletteFor(slide.accent ?? 'teal');
  return (
    <div className={cn('relative flex h-full w-full flex-col justify-center rounded-[2rem] p-16 text-white', palette.hero)}>
      <div className="relative">
        {slide.index && <span className="text-7xl font-extrabold text-white/40 tabular-nums">{slide.index}</span>}
        <h2 className={cn(T.title, 'mt-2 max-w-[24ch] text-[3rem] font-extrabold')}>{slide.title}</h2>
        {slide.subtitle && <p className="mt-4 max-w-[44ch] text-xl text-white/85">{slide.subtitle}</p>}
      </div>
    </div>
  );
}

function Concept({ slide }: { slide: ConceptSlide }) {
  const Icon = deckIcon(slide.icon);
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <div className={cn(T.iconChip, fadeUp, 'h-14 w-14')}>
        <Icon className="h-7 w-7 text-[color:var(--slide-accent)]" strokeWidth={1.75} />
      </div>
      <SlideTitle className={cn('mt-6 max-w-[24ch] text-[2.75rem]', fadeUp)}>{slide.title}</SlideTitle>
      <div className={T.accentRule} />
      {slide.body && (
        <p className={cn('mt-6 max-w-[52ch] text-2xl leading-relaxed text-zinc-600 dark:text-zinc-300', fadeUp)}>
          {slide.body}
        </p>
      )}
    </div>
  );
}

function Bullets({ slide }: { slide: BulletsSlide }) {
  const cols = slide.columns ?? (slide.bullets.length > 4 ? 2 : 1);
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <SlideTitle className="max-w-[26ch]">{slide.title}</SlideTitle>
      <div className={T.accentRule} />
      <ul className={cn('mt-8 grid gap-4', cols === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
        {slide.bullets.map((b, i) => {
          const Icon = deckIcon(b.icon);
          return (
            <li
              key={i}
              style={{ '--i': i } as React.CSSProperties}
              className={cn('flex items-start gap-4 rounded-2xl p-4', T.surface, fadeUp, 'deck-stagger')}
            >
              <span className={T.iconChip}>
                <Icon className={T.iconInChip} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-xl font-semibold leading-snug">{b.text}</p>
                {b.sub && <p className="mt-0.5 text-base text-zinc-500 dark:text-zinc-400">{b.sub}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TwoColumn({ slide }: { slide: TwoColumnSlide }) {
  const grid =
    slide.ratio === '1-2' ? 'grid-cols-[1fr_2fr]' : slide.ratio === '2-1' ? 'grid-cols-[2fr_1fr]' : 'grid-cols-2';
  const col = (c: { heading?: string; markdown: string }, i: number) => (
    <div
      key={i}
      style={{ '--i': i } as React.CSSProperties}
      className={cn('flex flex-col p-6 text-lg', T.surface, fadeUp, 'deck-stagger')}
    >
      {c.heading && (
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[color:var(--slide-accent)]">
          {c.heading}
        </h3>
      )}
      <DeckMarkdown className="text-lg">{c.markdown}</DeckMarkdown>
    </div>
  );
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <SlideTitle className="max-w-[28ch]">{slide.title}</SlideTitle>
      <div className={T.accentRule} />
      <div className={cn('mt-8 grid gap-5', grid)}>{[slide.left, slide.right].map(col)}</div>
    </div>
  );
}

function BigStat({ slide }: { slide: BigStatSlide }) {
  const TrendIcon = slide.trend === 'down' ? TrendingDown : slide.trend === 'up' ? TrendingUp : Minus;
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-center">
      <div className={cn('flex items-center gap-4', fadeUp)}>
        <span className="bg-gradient-to-br from-[var(--slide-accent)] to-fuchsia-500 bg-clip-text text-[9rem] font-extrabold leading-none tabular-nums text-transparent">
          {slide.value}
        </span>
        {slide.trend && (
          <TrendIcon className="h-12 w-12 text-[color:var(--slide-accent)]" strokeWidth={2.25} />
        )}
      </div>
      <p className={cn('mt-4 max-w-[40ch] text-2xl font-semibold', fadeUp)}>{slide.label}</p>
      {slide.context && (
        <p className={cn('mt-3 max-w-[48ch] text-lg text-zinc-500 dark:text-zinc-400', fadeUp)}>{slide.context}</p>
      )}
    </div>
  );
}

function StatTrio({ slide }: { slide: StatTrioSlide }) {
  return (
    <div className="flex h-full w-full flex-col justify-center">
      {slide.title && <SlideTitle className="mb-8 max-w-[26ch]">{slide.title}</SlideTitle>}
      <div className={cn('grid gap-5', slide.stats.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
        {slide.stats.map((s, i) => (
          <div
            key={i}
            style={{ '--i': i } as React.CSSProperties}
            className={cn('flex flex-col items-center p-8 text-center', T.surface, fadeUp, 'deck-stagger')}
          >
            <span className="bg-gradient-to-br from-[var(--slide-accent)] to-fuchsia-500 bg-clip-text text-6xl font-extrabold tabular-nums text-transparent">
              {s.value}
            </span>
            <span className="mt-3 text-lg font-medium text-zinc-600 dark:text-zinc-300">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuoteLayout({ slide }: { slide: QuoteSlide }) {
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <QuoteIcon className={cn('h-16 w-16 text-[color:var(--slide-accent)] opacity-40', fadeUp)} />
      <blockquote className={cn('mt-4 max-w-[40ch] text-4xl font-semibold leading-snug', fadeUp)}>
        {slide.quote}
      </blockquote>
      {(slide.attribution || slide.source) && (
        <figcaption className={cn('mt-6 text-xl text-zinc-500 dark:text-zinc-400', fadeUp)}>
          {slide.attribution && <span className="font-semibold text-[color:var(--slide-accent)]">— {slide.attribution}</span>}
          {slide.source && <span className="ml-2">{slide.source}</span>}
        </figcaption>
      )}
    </div>
  );
}

function Definition({ slide }: { slide: DefinitionSlide }) {
  const t = useTranslations('deck');
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <Kicker>{t('definition')}</Kicker>
      <h2 className={cn(T.title, 'mt-4 text-[3rem]', fadeUp)}>{slide.term}</h2>
      {slide.pronunciation && (
        <p className="mt-1 text-xl italic text-zinc-400">/{slide.pronunciation}/</p>
      )}
      <div className={T.accentRule} />
      <p className={cn('mt-6 max-w-[52ch] text-2xl leading-relaxed text-zinc-600 dark:text-zinc-300', fadeUp)}>
        {slide.definition}
      </p>
      {slide.example && (
        <div className={cn('mt-6 max-w-[52ch] border-l-4 border-[var(--slide-accent)] bg-[color:var(--slide-accent)]/5 p-4 text-lg italic', fadeUp)}>
          {slide.example}
        </div>
      )}
    </div>
  );
}

function Comparison({ slide }: { slide: ComparisonSlide }) {
  const pros = slide.kind === 'prosCons';
  const side = (s: { heading: string; items: string[] }, good: boolean, key: number) => (
    <div
      key={key}
      style={{ '--i': key } as React.CSSProperties}
      className={cn('flex flex-col p-6', T.surface, fadeUp, 'deck-stagger')}
    >
      <h3 className={cn('mb-4 text-xl font-bold', pros ? (good ? 'text-emerald-600' : 'text-rose-600') : 'text-[color:var(--slide-accent)]')}>
        {s.heading}
      </h3>
      <ul className="space-y-3">
        {s.items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 text-lg">
            {pros ? (
              good ? (
                <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <X className="mt-1 h-5 w-5 shrink-0 text-rose-500" />
              )
            ) : (
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--slide-accent)]" />
            )}
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <SlideTitle className="mb-8 max-w-[28ch]">{slide.title}</SlideTitle>
      <div className="grid grid-cols-2 gap-5">
        {side(slide.a, true, 0)}
        {side(slide.b, false, 1)}
      </div>
    </div>
  );
}

function Process({ slide }: { slide: ProcessSlide }) {
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <SlideTitle className="mb-8 max-w-[28ch]">{slide.title}</SlideTitle>
      <ol className="grid grid-cols-1 gap-4">
        {slide.steps.map((step, i) => {
          const Icon = deckIcon(step.icon);
          return (
            <li
              key={i}
              style={{ '--i': i } as React.CSSProperties}
              className={cn('flex items-start gap-4 p-4', T.surface, fadeUp, 'deck-stagger')}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--slide-accent)] text-lg font-bold text-white">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {step.icon && <Icon className="h-5 w-5 text-[color:var(--slide-accent)]" strokeWidth={1.75} />}
                  <p className="text-xl font-semibold">{step.title}</p>
                </div>
                {step.detail && <p className="mt-1 text-base text-zinc-500 dark:text-zinc-400">{step.detail}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Diagram({ slide }: { slide: DiagramSlide }) {
  return (
    <div className="flex h-full w-full flex-col justify-center">
      {slide.title && <SlideTitle className="mb-4 max-w-[30ch] text-[2rem]">{slide.title}</SlideTitle>}
      <div className={cn('flex min-h-0 flex-1 items-center justify-center overflow-hidden p-5', T.surface, fadeUp)}>
        <div className="max-h-full max-w-full [&_svg]:max-h-[400px] [&_svg]:w-auto">
          <MermaidDiagram payload={slide.mermaid} />
        </div>
      </div>
      {slide.caption && <p className="mt-3 text-center text-base text-zinc-500 dark:text-zinc-400">{slide.caption}</p>}
    </div>
  );
}

function ChartLayout({ slide }: { slide: ChartSlide }) {
  return (
    <div className="flex h-full w-full flex-col justify-center">
      {slide.title && <SlideTitle className="mb-4 max-w-[30ch] text-[2rem]">{slide.title}</SlideTitle>}
      <div className={cn('flex min-h-0 flex-1 items-center justify-center p-5', T.surface, fadeUp)}>
        <div className="h-[380px] w-full">
          <TutorChart payload={slide.chart} />
        </div>
      </div>
      {slide.caption && <p className="mt-3 text-center text-base text-zinc-500 dark:text-zinc-400">{slide.caption}</p>}
    </div>
  );
}

const CALLOUT_STYLE: Record<CalloutSlide['variant'], { ring: string; label: string; emoji: string }> = {
  tip: { ring: 'border-emerald-400/50 bg-emerald-50 dark:bg-emerald-950/30', label: 'text-emerald-600', emoji: '💡' },
  warning: { ring: 'border-amber-400/50 bg-amber-50 dark:bg-amber-950/30', label: 'text-amber-600', emoji: '⚠️' },
  note: { ring: 'border-sky-400/50 bg-sky-50 dark:bg-sky-950/30', label: 'text-sky-600', emoji: '📝' },
  key: { ring: 'border-violet-400/50 bg-violet-50 dark:bg-violet-950/30', label: 'text-violet-600', emoji: '🔑' },
  example: { ring: 'border-teal-400/50 bg-teal-50 dark:bg-teal-950/30', label: 'text-teal-600', emoji: '🧩' },
};

function Callout({ slide }: { slide: CalloutSlide }) {
  const s = CALLOUT_STYLE[slide.variant];
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <div className={cn('rounded-3xl border-2 p-10 shadow-lg', s.ring, fadeUp)}>
        <div className={cn('mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide', s.label)}>
          <span className="text-2xl">{s.emoji}</span>
          {slide.title ?? slide.variant}
        </div>
        <DeckMarkdown className="text-2xl leading-relaxed">{slide.markdown}</DeckMarkdown>
      </div>
    </div>
  );
}

function Recap({ slide }: { slide: RecapSlide }) {
  const t = useTranslations('deck');
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <Kicker>{t('recap')}</Kicker>
      <SlideTitle className="mt-3 mb-6 max-w-[26ch]">{slide.title}</SlideTitle>
      <ul className="space-y-3">
        {slide.points.map((p, i) => (
          <li
            key={i}
            style={{ '--i': i } as React.CSSProperties}
            className={cn('flex items-start gap-3 text-2xl', fadeUp, 'deck-stagger')}
          >
            <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--slide-accent)] text-base font-bold text-white">
              {i + 1}
            </span>
            <span className="leading-snug">{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuickCheck({ slide }: { slide: QuickCheckSlide }) {
  const t = useTranslations('deck');
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <Kicker>{t('quickCheck')}</Kicker>
      <h2 className={cn(T.title, 'mt-3 max-w-[34ch] text-[2.25rem]', fadeUp)}>{slide.question}</h2>
      {slide.options && slide.options.length > 0 && (
        <ul className="mt-8 grid grid-cols-2 gap-4">
          {slide.options.map((opt, i) => {
            const correct = revealed && opt.correct;
            const wrong = revealed && !opt.correct;
            return (
              <li key={i} style={{ '--i': i } as React.CSSProperties} className={cn(fadeUp, 'deck-stagger')}>
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left text-xl transition-transform duration-150 hover:-translate-y-0.5',
                    correct
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                      : wrong
                        ? 'border-zinc-200 opacity-50 dark:border-zinc-700'
                        : 'border-zinc-200 bg-white/70 hover:border-[var(--slide-accent)] dark:border-zinc-700 dark:bg-zinc-900/60',
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--slide-accent)]/15 text-sm font-bold text-[color:var(--slide-accent)]">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                  {correct && <Check className="h-5 w-5 text-emerald-500" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {!slide.options?.length && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-8 w-fit rounded-xl bg-[var(--slide-accent)] px-5 py-2.5 font-semibold text-white transition-transform duration-150 hover:-translate-y-0.5"
        >
          {t('revealAnswer')}
        </button>
      )}
      {revealed && slide.answerExplanation && (
        <div className="mt-6 max-w-[60ch] rounded-2xl border border-emerald-400/40 bg-emerald-50 p-4 text-lg dark:bg-emerald-950/30">
          {slide.answerExplanation}
        </div>
      )}
    </div>
  );
}

/* ---------- dispatcher ---------- */

export function Slide({
  slide,
  index,
  deckAccent,
}: {
  slide: DeckSlide;
  index: number;
  deckAccent: DeckAccent;
}) {
  const accentHex = resolveSlideAccentHex(deckAccent, slide, index);
  const palette = paletteFor(deckAccent);
  const isHero = slide.layout === 'cover' || slide.layout === 'section';

  return (
    <div
      style={{ '--slide-accent': accentHex } as React.CSSProperties}
      className={cn(
        'relative h-full w-full overflow-hidden rounded-[2rem]',
        isHero ? '' : cn(palette.canvasLight, palette.canvasDark, 'p-14'),
      )}
    >
      {!isHero && (
        <>
          <div className={T.blobTopRight} />
          <div className={T.blobBotLeft} />
          <div className={T.dotTexture} />
        </>
      )}
      <div className="relative flex h-full w-full flex-col text-zinc-900 dark:text-zinc-100">
        <SlideBody slide={slide} />
      </div>
    </div>
  );
}

function SlideBody({ slide }: { slide: DeckSlide }) {
  switch (slide.layout) {
    case 'cover':
      return <Cover slide={slide} />;
    case 'section':
      return <Section slide={slide} />;
    case 'concept':
      return <Concept slide={slide} />;
    case 'bullets':
      return <Bullets slide={slide} />;
    case 'twoColumn':
      return <TwoColumn slide={slide} />;
    case 'bigStat':
      return <BigStat slide={slide} />;
    case 'statTrio':
      return <StatTrio slide={slide} />;
    case 'quote':
      return <QuoteLayout slide={slide} />;
    case 'definition':
      return <Definition slide={slide} />;
    case 'comparison':
      return <Comparison slide={slide} />;
    case 'process':
      return <Process slide={slide} />;
    case 'diagram':
      return <Diagram slide={slide} />;
    case 'chart':
      return <ChartLayout slide={slide} />;
    case 'callout':
      return <Callout slide={slide} />;
    case 'recap':
      return <Recap slide={slide} />;
    case 'quickCheck':
      return <QuickCheck slide={slide} />;
    default: {
      const _exhaustive: never = slide;
      return _exhaustive;
    }
  }
}
