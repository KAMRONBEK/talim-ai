'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@talim/ui';

/**
 * Shared rich-text renderer: GFM markdown + LaTeX math (KaTeX). Used wherever
 * generated content can contain formulas — quiz questions/options/explanations,
 * etc. `inline` strips paragraph wrapping for use inside a line (e.g. an option).
 */
export function RichText({
  children,
  className,
  inline = false,
}: {
  children: string;
  className?: string;
  inline?: boolean;
}) {
  return (
    <div
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
        {children}
      </ReactMarkdown>
    </div>
  );
}
