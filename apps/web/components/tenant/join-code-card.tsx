'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, RefreshCw } from 'lucide-react';
import { Button, Card, CardContent, CardHeader } from '@talim/ui';
import { useRegenerateJoinCode, useTenant } from '@/hooks/useTenant';

export function JoinCodeCard() {
  const t = useTranslations('tenant');
  const tc = useTranslations('common');
  const { data: tenant, isError } = useTenant();
  const regenerate = useRegenerateJoinCode();
  const [copied, setCopied] = useState(false);
  const code = tenant?.joinCode ?? null;

  return (
    <Card className="border-primary bg-secondary shadow-soft">
      <CardHeader>
        <h2 className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          {t('joinCode.title')}
        </h2>
        <p className="text-sm text-secondary-foreground/80">{t('joinCode.desc')}</p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        {/* A failed GET /tenant left `tenant` undefined, so the card affirmatively stated
            the class had no code — and still offered Regenerate. A tutor acting on that
            would invalidate the code already handed out to their class. Say the load
            failed, and take the destructive control away until we know the truth. */}
        {isError ? (
          <span className="text-sm text-destructive">{tc('loadError')}</span>
        ) : (
          <span className="font-label text-3xl font-bold tracking-[0.14em] text-primary">
            {code ?? t('joinCode.none')}
          </span>
        )}
        {code && (
          <Button
            variant="outline"
            size="sm"
            className="border-primary/30 bg-card text-primary hover:bg-primary/5 hover:text-primary"
            onClick={async () => {
              await navigator.clipboard?.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            <Copy className="h-4 w-4" />
            {copied ? t('students.copied') : t('joinCode.copy')}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary-foreground hover:bg-primary/10 hover:text-primary"
          disabled={regenerate.isPending || isError}
          onClick={() => {
            if (confirm(t('joinCode.regenerateConfirm'))) regenerate.mutate();
          }}
        >
          <RefreshCw className="h-4 w-4" />
          {t('joinCode.regenerate')}
        </Button>
      </CardContent>
    </Card>
  );
}
