'use client';

import { useTranslations } from 'next-intl';
import { useUpgradeModal } from '@/store/useUpgradeModal';
import { useAuthStore } from '@/store/useAuthStore';
import { classifyLimitError, INDIVIDUAL_QUOTA_FEATURES } from '@/lib/limit-error';

/**
 * Returns `handleLimitError(error, fallback?)`: the one place that turns any API
 * limit error into the right UX.
 *
 *  - A self-serve INDIVIDUAL quota/plan-file limit (free → Pro) → opens the global
 *    promotion modal with a feature-specific headline; returns `null` (nothing to
 *    show inline).
 *  - A tenant-owner limit, an already-top-plan limit, the hard file cap, an inactive
 *    subscription, or a learner block → returns a localized message for the caller
 *    to show inline (no modal — those aren't self-serve individual upgrades).
 *  - Anything that isn't a limit error → returns `fallback ?? null`.
 */
export function useLimitErrorHandler() {
  const openUpgrade = useUpgradeModal((s) => s.openUpgrade);
  const role = useAuthStore((s) => s.user?.role);
  const t = useTranslations('account.billing.upgrade.limits');

  return (error: unknown, fallback?: string): string | null => {
    const info = classifyLimitError(error);
    const isIndividual = role === 'INDIVIDUAL';

    switch (info.kind) {
      case 'quota': {
        const promotable =
          isIndividual &&
          info.upgradePlanCode === 'INDIVIDUAL_PRO' &&
          INDIVIDUAL_QUOTA_FEATURES.includes(info.feature);
        if (promotable) {
          openUpgrade({
            headline: t(`headline.${info.feature}`),
            subhead: t('subheadDaily', { used: info.used, limit: info.limit }),
          });
          return null;
        }
        if (info.feature === 'STUDENT') return t('seat');
        // Tenant owner who can still upgrade their org plan, or someone already on
        // the top plan whose daily allowance simply resets tomorrow.
        return info.upgradePlanCode ? t('tenantUpgrade') : t('atCap');
      }
      case 'planFile': {
        if (isIndividual && info.upgradePlanCode === 'INDIVIDUAL_PRO') {
          openUpgrade({
            headline: t('headline.file'),
            subhead: t('subheadFile', {
              pages: info.maxPages ?? 0,
              mb: info.maxFileSizeMb ?? 0,
            }),
          });
          return null;
        }
        return info.message || t('fileLimit');
      }
      case 'fileTooLarge':
        return t('fileTooLarge', { mb: info.maxFileSizeMb });
      case 'inactive':
        return info.message || t('inactive');
      case 'forbidden':
        return info.message || t('forbidden');
      case 'none':
        return fallback ?? null;
    }
  };
}
