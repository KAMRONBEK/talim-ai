'use client';

import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, BookOpen, Users } from 'lucide-react';
import type { AppLocale, ContentStatus, ContentType } from '@talim/types';
import { Badge, buttonVariants, cn } from '@talim/ui';
import { MaterialMediaPanel } from '@/components/tenant/material-media-panel';
import { useTenantContent } from '@/hooks/useTenantContent';
import { formatRelativeTime } from '@/lib/format-relative-time';

// Type badge label reuses the library filter chip strings (PDF / Video / Slides).
const TYPE_LABEL_KEY: Record<ContentType, string> = {
  PDF: 'filterPdf',
  YOUTUBE: 'filterVideo',
  SLIDE: 'filterSlides',
};

export default function TenantMaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('tenant');
  const tc = useTranslations('content');
  const tCommon = useTranslations('common');
  const locale = useLocale() as AppLocale;
  const { data: content, isLoading, isError, error } = useTenantContent(id);

  const backLink = (
    <Link
      href="/tenant/materials"
      className="inline-flex items-center gap-1.5 font-label text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {t('material.back')}
    </Link>
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        {backLink}
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  if (isError || !content) {
    const status = (error as { response?: { status?: number } } | null)?.response?.status;
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        {backLink}
        <p className="text-sm text-destructive">
          {status === 404 ? t('material.notFound') : tCommon('loadError')}
        </p>
      </div>
    );
  }

  const statusMeta: Record<ContentStatus, { label: string; className: string }> = {
    READY: { label: tc('statusReady'), className: 'border-primary/50 text-primary' },
    FAILED: { label: tc('statusFailed'), className: 'border-destructive/50 text-destructive' },
    PENDING: { label: tc('processing'), className: 'border-border text-muted-foreground' },
    PROCESSING: { label: tc('processing'), className: 'border-border text-muted-foreground' },
  };
  const st = statusMeta[content.status];

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {backLink}

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-label text-[10px] uppercase tracking-wide">
                {t(TYPE_LABEL_KEY[content.type])}
              </Badge>
              <Badge
                variant="outline"
                className={cn('font-label text-[10px] uppercase tracking-wide', st.className)}
              >
                {st.label}
              </Badge>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{content.title}</h1>
            <p className="text-sm text-muted-foreground">
              {t('material.created')} · {formatRelativeTime(content.createdAt, locale)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/tenant/materials/${id}/assign`}
              className={cn(buttonVariants({ variant: 'gradient' }))}
            >
              <Users className="h-4 w-4" />
              {t('assign.title')}
            </Link>
            <Link href={`/content/${id}`} className={cn(buttonVariants({ variant: 'outline' }))}>
              <BookOpen className="h-4 w-4" />
              {t('material.openStudyView')}
            </Link>
          </div>
        </div>
      </div>

      <MaterialMediaPanel contentId={id} />
    </div>
  );
}
