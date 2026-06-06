'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { HtmlSandboxPayload } from '@talim/types';
import { buildSandboxHtml } from '@/lib/html-sandbox-templates';

export function HtmlSandbox({ payload }: { payload: HtmlSandboxPayload }) {
  const t = useTranslations('chat');
  const srcDoc = useMemo(() => buildSandboxHtml(payload), [payload]);

  return (
    <div className="my-2 overflow-hidden rounded-md border bg-card">
      <iframe
        title={t('simulationLabel')}
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        className="h-[300px] w-full border-0"
        aria-label={t('simulationLabel')}
      />
    </div>
  );
}
