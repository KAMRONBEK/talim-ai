'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, getPathname } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n/routing';
import { api } from '@/lib/api';
import { setApiLocale } from '@/lib/locale-api';
import { useAuthStore } from '@/store/useAuthStore';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('locales');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);

  const handleChange = (next: Locale) => {
    if (next === locale) return;
    setApiLocale(next);

    if (token) {
      void api.patch('/auth/me', { preferredLocale: next }).catch(() => {});
    }

    // Full navigation avoids webpack chunk errors on soft locale switches in dev
    const href = getPathname({ href: pathname, locale: next });
    window.location.assign(href);
  };

  return (
    <select
      aria-label={tCommon('language')}
      value={locale}
      onChange={(e) => handleChange(e.target.value as Locale)}
      className={
        compact
          ? 'h-8 rounded-md border border-input bg-background px-2 text-xs'
          : 'h-9 rounded-md border border-input bg-background px-2 text-sm'
      }
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {t(loc)}
        </option>
      ))}
    </select>
  );
}
