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

// ICU (in Node/V8) ships no Uzbek relative-time data, so
// `Intl.RelativeTimeFormat('uz')` falls back to raw output like "-3 w" / "-2 d".
// Format Uzbek manually instead. Uzbek is the primary audience.
const UZ_UNIT_LABELS: Record<Intl.RelativeTimeFormatUnit, string> = {
  year: 'yil',
  years: 'yil',
  quarter: 'chorak',
  quarters: 'chorak',
  month: 'oy',
  months: 'oy',
  week: 'hafta',
  weeks: 'hafta',
  day: 'kun',
  days: 'kun',
  hour: 'soat',
  hours: 'soat',
  minute: 'daqiqa',
  minutes: 'daqiqa',
  second: 'soniya',
  seconds: 'soniya',
};

function formatUzbek(value: number, unit: Intl.RelativeTimeFormatUnit): string {
  const label = UZ_UNIT_LABELS[unit] ?? String(unit);
  const n = Math.abs(value);
  if (n === 0) return 'hozirgina';
  // past: "3 hafta oldin"; future: "3 haftadan keyin"
  return value < 0 ? `${n} ${label} oldin` : `${n} ${label}dan keyin`;
}

export function formatRelativeTime(date: string | Date, locale: AppLocale = 'uz'): string {
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = then.getTime() - Date.now();
  const absMs = Math.abs(diffMs);

  const rtf =
    locale === 'uz' ? null : new Intl.RelativeTimeFormat(LOCALE_MAP[locale], { numeric: 'auto' });

  for (const { unit, ms } of UNITS) {
    if (absMs >= ms || unit === 'second') {
      const value = Math.round(diffMs / ms);
      return rtf ? rtf.format(value, unit) : formatUzbek(value, unit);
    }
  }
  return rtf ? rtf.format(0, 'second') : formatUzbek(0, 'second');
}
