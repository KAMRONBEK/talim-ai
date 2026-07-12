'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@talim/ui';
import { SelectionAsk } from '@/components/learning/selection-ask';

/**
 * Model output doesn't reliably arrive in remark-math's dialect: formulas often come as
 * \( ... \) / \[ ... \] instead of $ ... $ / $$ ... $$, and stems use bare newlines that
 * markdown collapses into spaces (mashing an expression into the question line). Normalize
 * both before parsing. Math segments are left untouched (the split keeps $$ blocks intact).
 */
function normalizeGeneratedText(text: string): string {
  return text
    .split(/(\$\$[\s\S]*?\$\$)/)
    .map((part, i) => {
      if (i % 2 === 1) return part; // inside a $$...$$ block
      return part
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, expr: string) => `$$${expr}$$`)
        .replace(/\\\(([\s\S]*?)\\\)/g, (_, expr: string) => `$${expr}$`)
        .replace(/\n/g, '  \n'); // single newline → markdown hard break
    })
    .join('');
}

/**
 * Shared rich-text renderer: GFM markdown + LaTeX math (KaTeX). Used wherever
 * generated content can contain formulas — quiz questions/options/explanations,
 * etc. `inline` strips paragraph wrapping for use inside a line (e.g. an option).
 *
 * `askAi` opts into the text-selection "Ask AI" tooltip (block mode only) for
 * readers that sit next to the AI tutor. It defaults off so quiz/game/chat
 * usages — which have no tutor composer to seed — are unaffected.
 */
export function RichText({
  children,
  className,
  inline = false,
  askAi = false,
}: {
  children: string;
  className?: string;
  inline?: boolean;
  askAi?: boolean;
}) {
  // In inline mode this renderer is dropped inside a line of phrasing content
  // (e.g. inside a quiz explanation <p>/<span>), so the wrapper must be a
  // <span> — a <div> there is invalid HTML and triggers a hydration error.
  const Wrapper = inline ? 'span' : 'div';
  const rendered = (
    <Wrapper
      className={cn(
        'prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-p:leading-relaxed',
        inline && 'prose-p:m-0 prose-p:inline',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { output: 'html', throwOnError: false, strict: false }]]}
        components={inline ? { p: ({ children: c }) => <>{c}</> } : undefined}
      >
        {normalizeGeneratedText(children)}
      </ReactMarkdown>
    </Wrapper>
  );

  // The selection tooltip needs a block container to anchor to, so it's only
  // offered in block mode (an inline span can't host an absolutely-positioned child).
  if (askAi && !inline) {
    return <SelectionAsk>{rendered}</SelectionAsk>;
  }
  return rendered;
}
