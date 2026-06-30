'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, RefreshCw } from 'lucide-react';
import { Button, Card, CardContent, CardHeader } from '@talim/ui';
import { useRegenerateJoinCode, useTenant } from '@/hooks/useTenant';

export function JoinCodeCard() {
  const t = useTranslations('tenant');
  const { data: tenant } = useTenant();
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
        <span className="font-label text-3xl font-bold tracking-[0.14em] text-primary">
          {code ?? t('joinCode.none')}
        </span>
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
          disabled={regenerate.isPending}
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
