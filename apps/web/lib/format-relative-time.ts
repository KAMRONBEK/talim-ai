import type { AppLocale } from '@talim/types';

const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000 },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
  { unit: 'second', ms: 1000 },
];

const LOCALE_MAP: Record<AppLocale, string> = {
  uz: 'uz',
  en: 'en',
  ru: 'ru',
};

export function formatRelativeTime(date: string | Date, locale: AppLocale = 'uz'): string {
  const rtf = new Intl.RelativeTimeFormat(LOCALE_MAP[locale], { numeric: 'auto' });
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = then.getTime() - Date.now();
  const absMs = Math.abs(diffMs);

  for (const { unit, ms } of UNITS) {
    if (absMs >= ms || unit === 'second') {
      const value = Math.round(diffMs / ms);
      return rtf.format(value, unit);
    }
  }
  return rtf.format(0, 'second');
}
