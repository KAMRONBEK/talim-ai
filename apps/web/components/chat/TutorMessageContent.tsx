'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { GRAPH_FENCE_LANG, parseGraphBlock } from '@talim/types';
import { preprocessLatex } from '@/lib/preprocess-latex';
import { DesmosGraph } from './DesmosGraph';

interface TutorMessageContentProps {
  content: string;
  streaming?: boolean;
}

export function TutorMessageContent({ content, streaming }: TutorMessageContentProps) {
  const processed = preprocessLatex(content);

  return (
    <div className={`tutor-md text-left ${streaming ? 'opacity-90' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { output: 'html', throwOnError: false }]]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          h1: ({ children }) => <h3 className="mb-2 text-base font-semibold">{children}</h3>,
          h2: ({ children }) => <h3 className="mb-2 text-base font-semibold">{children}</h3>,
          h3: ({ children }) => <h4 className="mb-2 text-sm font-semibold">{children}</h4>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="mb-2 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted px-2 py-1 font-semibold">{children}</th>
          ),
          td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className ?? '');
            const lang = match?.[1];
            const raw = String(children).replace(/\n$/, '');

            if (lang === GRAPH_FENCE_LANG) {
              const payload = parseGraphBlock(raw);
              if (payload) return <DesmosGraph payload={payload} />;
            }

            const isBlock = Boolean(className);
            if (isBlock) {
              return (
                <pre className="mb-2 overflow-x-auto rounded-md bg-muted p-3 text-xs last:mb-0">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            }

            return (
              <code className="rounded bg-muted px-1 py-0.5 text-xs" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
