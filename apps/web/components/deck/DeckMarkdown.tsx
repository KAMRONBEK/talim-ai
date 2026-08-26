'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@talim/ui';

/**
 * Inline variant for the many layouts that render a single string inside their own
 * typography — bullets, definitions, subtitles, stat labels, quick-check options.
 *
 * Only two of the sixteen slide layouts went through DeckMarkdown, so everywhere else a
 * maths deck printed its formulas as source: students read `$c^2 = a^2 + b^2$`, dollar
 * signs, carets and `\neq` included. DeckMarkdown itself cannot be dropped into those
 * spots because it wraps content in prose block elements and would fight the layout's
 * own sizing, so this renders the same math pipeline with the paragraph unwrapped.
 */
export function DeckText({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeKatex, { output: 'html', throwOnError: false, strict: false }]]}
      components={{
        // Keep the caller's element and classes; contribute only the formatted content.
        p: ({ children: c }) => <>{c}</>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

/** Compact markdown for slide bodies — supports GFM + math, no raw HTML. */
export function DeckMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        'prose prose-zinc max-w-none dark:prose-invert prose-p:my-1.5 prose-li:my-0.5 prose-strong:text-[color:var(--slide-accent)]',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { output: 'html', throwOnError: false, strict: false }]]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
