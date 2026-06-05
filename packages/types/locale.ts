export const SUPPORTED_LOCALES = ['uz', 'en', 'ru'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'uz';

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function parseAppLocale(value: string | undefined | null): AppLocale {
  if (value && isAppLocale(value)) return value;
  return DEFAULT_LOCALE;
}
