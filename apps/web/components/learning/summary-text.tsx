'use client';

import { useId, useMemo, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@talim/ui';
import { formatSummaryForDisplay } from '@/lib/format-summary';

// --- Structure derivation ---------------------------------------------------
// Summaries are stored as deliberately plain text (the generator forbids markdown
// headings/bold/lists and the server strips any that leak). So we derive the
// enriched-document structure client-side from the real signals that survive:
// short punctuation-free lines act as section headings, and any leaked list items
// become "Key points". Nothing is fabricated — elements are omitted when absent.

type Block = { kind: 'para'; text: string } | { kind: 'points'; items: string[] };
type Section = { title: string | null; blocks: Block[] };

const LIST_RE = /^\s*(?:[-*+•]|\d+[.)])\s+(.+)$/;
const HEADING_MD_RE = /^#{1,6}\s+(.+?)\s*#*$/;
const LETTER_RE = /[A-Za-zÀ-ÿА-Яа-яЎўҚқҒғҲҳ]/;

function stripInline(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/, '')
    .trim();
}

/** A single short line without terminal punctuation reads as a section heading. */
function asHeading(lines: string[]): string | null {
  const line = lines.length === 1 ? lines[0] : undefined;
  if (!line) return null;
  const md = line.match(HEADING_MD_RE);
  if (md?.[1]) return stripInline(md[1]);
  if (LIST_RE.test(line)) return null;
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length >= 1 && words.length <= 7 && line.length <= 64 && LETTER_RE.test(line) && !/[.!?…:;,]$/.test(line)) {
    return stripInline(line);
  }
  return null;
}

function parseSummary(text: string): Section[] {
  const cleaned = formatSummaryForDisplay(text);
  if (!cleaned) return [];

  const sections: Section[] = [{ title: null, blocks: [] }];
  for (const rawBlock of cleaned.split(/\n{2,}/)) {
    const lines = rawBlock
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    const heading = asHeading(lines);
    if (heading) {
      sections.push({ title: heading, blocks: [] });
      continue;
    }

    const current = sections[sections.length - 1];
    if (!current) continue;
    if (lines.every((l) => LIST_RE.test(l))) {
      const items = lines.map((l) => stripInline(l.replace(LIST_RE, '$1')));
      const last = current.blocks[current.blocks.length - 1];
      if (last && last.kind === 'points') last.items.push(...items);
      else current.blocks.push({ kind: 'points', items });
    } else {
      current.blocks.push({ kind: 'para', text: stripInline(lines.join(' ')) });
    }
  }

  return sections.filter((s) => s.title || s.blocks.length > 0);
}

/** Split a paragraph into its lead sentence + remainder (for the key-idea callout). */
function splitLead(text: string): [string, string] {
  const m = text.match(/^([\s\S]*?[.!?…])\s+([\s\S]+)$/);
  if (m?.[1] && m[2] && m[1].trim().length >= 12) return [m[1].trim(), m[2].trim()];
  return [text.trim(), ''];
}

function countWords(sections: Section[]): number {
  return sections
    .flatMap((s) => s.blocks)
    .reduce(
      (n, b) =>
        n + (b.kind === 'para' ? b.text : b.items.join(' ')).split(/\s+/).filter(Boolean).length,
      0,
    );
}

// The TOC rail is container-driven, not viewport-driven: SummaryText renders both
// in the wide study panel and inside narrow (max-w-lg) dialogs. Container queries
// show the rail only when the surrounding column is actually wide enough.
const CONTAINER_CSS = `
.summary-doc__grid{display:grid;gap:2rem;}
.summary-doc__toc{display:none;}
@container (min-width:640px){
  .summary-doc__grid{grid-template-columns:12.5rem minmax(0,1fr);align-items:start;}
  .summary-doc__toc{display:block;position:sticky;top:0;}
}`;

const EYEBROW = 'font-label font-semibold uppercase tracking-[0.16em] text-muted-foreground';

export function SummaryText({
  text,
  className = 'text-[15px] leading-relaxed text-foreground/90',
}: {
  text: string;
  className?: string;
}) {
  const t = useTranslations('content');
  const uid = useId();
  const sections = useMemo(() => parseSummary(text), [text]);
  const [clickedIdx, setClickedIdx] = useState<number | null>(null);

  if (sections.length === 0) {
    return <p className={className}>{t('summaryNotAvailable')}</p>;
  }

  const tocItems = sections
    .map((s, i) => ({ title: s.title, i }))
    .filter((x): x is { title: string; i: number } => Boolean(x.title));
  const hasToc = tocItems.length >= 2;
  const activeIdx = clickedIdx ?? tocItems[0]?.i;
  const minutes = Math.max(1, Math.round(countWords(sections) / 200));
  const anchorId = (i: number) => `${uid}-sec-${i}`;

  // Ordinal shown in the "Section N" eyebrow (only counts titled sections).
  let titledSeen = 0;
  const ordinals = sections.map((s) => (s.title ? ++titledSeen : 0));

  let leadDone = false;
  const renderBlocks = (blocks: Block[]) => {
    const els: React.ReactNode[] = [];
    blocks.forEach((b, bi) => {
      if (b.kind === 'points') {
        els.push(
          <div key={`p-${bi}`}>
            <div className="font-display text-sm font-semibold text-primary">{t('keyPoints')}</div>
            <ul className="mt-3 space-y-2.5">
              {b.items.map((it, ii) => (
                <li key={ii} className="flex gap-3 text-[15px] leading-relaxed text-foreground/90">
                  <span className="mt-0.5 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                    {ii + 1}
                  </span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>,
        );
        return;
      }

      if (!leadDone) {
        leadDone = true;
        const [lead, rest] = splitLead(b.text);
        els.push(
          <div
            key={`lead-${bi}`}
            className="rounded-r-xl border-l-[3px] border-primary bg-accent px-5 py-4"
          >
            <div className={cn(EYEBROW, 'text-[10px] tracking-[0.14em] text-primary')}>
              {t('keyIdea')}
            </div>
            <p className="mt-1.5 font-display text-[17px] italic leading-snug text-foreground">
              <span className="marker-highlight">{lead}</span>
            </p>
          </div>,
        );
        if (rest) els.push(<p key={`rest-${bi}`} className={className}>{rest}</p>);
        return;
      }

      els.push(<p key={`t-${bi}`} className={className}>{b.text}</p>);
    });
    return els;
  };

  const reading = (
    <div className="max-w-[680px] space-y-8">
      <div className={cn(EYEBROW, 'text-[10.5px]')}>
        {t('summary')} · {t('readMinutes', { n: minutes })}
      </div>
      {sections.map((s, i) => (
        <section key={i} id={anchorId(i)} className="scroll-mt-6 space-y-4">
          {s.title && (
            <div>
              <div className={cn(EYEBROW, 'text-[10.5px] tracking-[0.14em]')}>
                {t('sectionN', { n: ordinals[i] ?? 0 })}
              </div>
              <h2 className="mt-1 font-display text-[26px] font-semibold leading-tight tracking-tight text-foreground">
                {s.title}
              </h2>
            </div>
          )}
          {renderBlocks(s.blocks)}
        </section>
      ))}
    </div>
  );

  if (!hasToc) {
    return <div className="mx-auto max-w-prose">{reading}</div>;
  }

  return (
    <div style={{ containerType: 'inline-size' } as CSSProperties}>
      <style>{CONTAINER_CSS}</style>
      <div className="summary-doc__grid">
        <aside className="summary-doc__toc">
          <div className={cn(EYEBROW, 'text-[10px] tracking-[0.12em]')}>{t('onThisPage')}</div>
          <nav className="mt-3 flex flex-col gap-1">
            {tocItems.map(({ title, i }) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setClickedIdx(i);
                  document
                    .getElementById(anchorId(i))
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-left text-[12.5px] transition-colors',
                  activeIdx === i
                    ? 'bg-accent font-semibold text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {title}
              </button>
            ))}
          </nav>
          <div className="mt-4 space-y-0.5 rounded-xl border border-border bg-card p-3">
            <div className="text-[13px] font-semibold text-foreground">
              {t('readMinutes', { n: minutes })}
            </div>
            <div className="text-[11.5px] text-muted-foreground">
              {t('sectionsCount', { count: tocItems.length })}
            </div>
          </div>
        </aside>
        <div>{reading}</div>
      </div>
    </div>
  );
}
