'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card, CardContent, CardHeader } from '@talim/ui';
import { useRegenerateJoinCode, useTenant } from '@/hooks/useTenant';

export function JoinCodeCard() {
  const t = useTranslations('tenant');
  const { data: tenant } = useTenant();
  const regenerate = useRegenerateJoinCode();
  const [copied, setCopied] = useState(false);
  const code = tenant?.joinCode ?? null;

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <h2 className="font-display text-lg font-semibold">{t('joinCode.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('joinCode.desc')}</p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <span className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-2.5 font-display text-xl font-bold tracking-[0.3em] text-primary">
          {code ?? t('joinCode.none')}
        </span>
        {code && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard?.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? t('students.copied') : t('joinCode.copy')}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={regenerate.isPending}
          onClick={() => {
            if (confirm(t('joinCode.regenerateConfirm'))) regenerate.mutate();
          }}
        >
          {t('joinCode.regenerate')}
        </Button>
      </CardContent>
    </Card>
  );
}
