'use client';

import { useTranslations } from 'next-intl';
import { Check, Sparkles, X } from 'lucide-react';
import { Button } from '@talim/ui';
import { useRequestUpgrade } from '@/hooks/useBilling';

/**
 * Pro upgrade modal. Billing is manual (no payment gateway), so "Request upgrade"
 * records a signal for an admin to activate rather than charging. Lightweight
 * self-contained overlay — @talim/ui has no Dialog primitive.
 */
export function UpgradeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('account.billing.upgrade');
  const requestUpgrade = useRequestUpgrade();

  if (!open) return null;

  const proFeatures = [
    t('features.uploads'),
    t('features.generations'),
    t('features.videos'),
    t('features.tutor'),
    t('features.podcastsSlides'),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-gradient-brand px-6 py-6 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide opacity-90">{t('proName')}</span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold">{t('title')}</h2>
          <p className="mt-1 text-3xl font-extrabold">
            {t('price')}
            <span className="ml-1 text-base font-medium opacity-80">{t('perMonth')}</span>
          </p>
        </div>

        <div className="space-y-3 px-6 py-5">
          <ul className="space-y-2.5">
            {proFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">{t('manualNote')}</p>

          {requestUpgrade.isSuccess ? (
            <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success-muted/30 p-3 text-sm font-medium text-success">
              <Check className="h-4 w-4" />
              {t('requested')}
            </div>
          ) : (
            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              onClick={() => requestUpgrade.mutate()}
              disabled={requestUpgrade.isPending}
            >
              <Sparkles className="h-5 w-5" />
              {requestUpgrade.isPending ? t('requesting') : t('requestCta')}
            </Button>
          )}
          {requestUpgrade.isError && <p className="text-sm text-destructive">{t('requestError')}</p>}
        </div>
      </div>
    </div>
  );
}
