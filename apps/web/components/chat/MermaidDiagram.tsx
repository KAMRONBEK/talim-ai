'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { MermaidPayload } from '@talim/types';

export function MermaidDiagram({ payload }: { payload: MermaidPayload }) {
  const t = useTranslations('chat');
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId().replace(/:/g, '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
          securityLevel: 'strict',
          fontFamily: 'inherit',
        });
        const { svg } = await mermaid.render(`mermaid-${uniqueId}`, payload.diagram);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Render failed');
        }
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [payload.diagram, uniqueId]);

  if (error) {
    return (
      <div className="my-2 rounded-md border border-destructive/40 bg-muted p-3 text-xs">
        <p className="mb-1 font-medium text-destructive">{t('diagramError')}</p>
        <pre className="overflow-x-auto whitespace-pre-wrap text-muted-foreground">{payload.diagram}</pre>
      </div>
    );
  }

  return (
    <div className="my-2">
      {payload.title && <p className="mb-1 text-xs font-medium text-muted-foreground">{payload.title}</p>}
      <div
        ref={containerRef}
        className="overflow-x-auto rounded-md border bg-card p-2 [&_svg]:mx-auto"
        aria-label={t('diagramLabel')}
      />
    </div>
  );
}
