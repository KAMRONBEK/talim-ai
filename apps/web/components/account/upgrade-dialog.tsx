'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Sparkles, X } from 'lucide-react';
import { Button, cn } from '@talim/ui';
import { Link } from '@/i18n/navigation';
import { useRequestUpgrade } from '@/hooks/useBilling';
import {
  ANNUAL_SAVING_PERCENT,
  effectiveMonthlyUzs,
  formatUzs,
  getPlan,
  planFeatureSpecs,
  type BillingPeriod,
} from '@/lib/pricing';

const PRO = getPlan('INDIVIDUAL_PRO')!;

/**
 * Pro upgrade modal. Billing is manual (no payment gateway), so "Request upgrade"
 * records a signal for an admin to activate rather than charging. Pricing/features
 * come from the shared `lib/pricing` config so this stays in sync with /pricing.
 */
export function UpgradeDialog({
  open,
  onClose,
  headline,
  subhead,
}: {
  open: boolean;
  onClose: () => void;
  /** Optional override headline (e.g. the "file exceeds your plan" prompt). */
  headline?: string;
  subhead?: string;
}) {
  const t = useTranslations('account.billing.upgrade');
  const tp = useTranslations('pricing');
  const requestUpgrade = useRequestUpgrade();
  const [period, setPeriod] = useState<BillingPeriod>('annual');

  // This is a single, app-wide instance that is never unmounted (GlobalUpgradeModal
  // always renders it; `!open` only returns null). Reset transient state each time
  // it opens so a prior "Request sent" success/error — or period choice — doesn't
  // leak into the next limit that opens the modal.
  useEffect(() => {
    if (open) {
      requestUpgrade.reset();
      setPeriod('annual');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const annual = period === 'annual';
  const price = annual ? effectiveMonthlyUzs(PRO) : PRO.monthlyUzs;
  const features = planFeatureSpecs(PRO).map((s) => tp(s.key, s.values));

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
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Gradient header with plan + price */}
        <div className="relative overflow-hidden bg-gradient-brand px-6 py-6 text-white">
          <div className="pointer-events-none absolute inset-0 bg-girih opacity-40 mix-blend-overlay" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide opacity-90">
                {tp('plans.pro')}
              </span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold">{headline ?? t('title')}</h2>
            {subhead && <p className="mt-1 text-sm opacity-90">{subhead}</p>}

            {/* Monthly / annual toggle */}
            <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/15 p-1 text-xs font-semibold">
              {(['annual', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={period === p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'rounded-full px-3 py-1 transition-colors',
                    period === p ? 'bg-white text-primary' : 'text-white/85 hover:text-white',
                  )}
                >
                  {tp(`period.${p}`)}
                  {p === 'annual' && ` · ${tp('period.save', { pct: ANNUAL_SAVING_PERCENT })}`}
                </button>
              ))}
            </div>

            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold">{formatUzs(price)}</span>
              <span className="text-base font-medium opacity-80">
                {tp('currency')} {tp('perMonth')}
              </span>
            </p>
            {annual && (
              <p className="text-xs opacity-80">
                {tp('billedAnnually', { total: formatUzs(PRO.annualUzs) })}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 px-6 py-5">
          <ul className="space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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

          <p className="pt-1 text-center text-xs text-muted-foreground">
            {tp('needTeam')}{' '}
            <Link href="/pricing" onClick={onClose} className="font-semibold text-primary hover:underline">
              {tp('needTeamLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
