import { DEFAULT_LOCALE, parseAppLocale, type AppLocale } from '@talim/types';

let currentLocale: AppLocale = DEFAULT_LOCALE;

export function setApiLocale(locale: AppLocale): void {
  currentLocale = locale;
}

export function getApiLocale(): AppLocale {
  if (typeof window !== 'undefined') {
    const segment = window.location.pathname.split('/')[1];
    if (segment) return parseAppLocale(segment);
  }
  return currentLocale;
}
