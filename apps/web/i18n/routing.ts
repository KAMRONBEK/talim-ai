import { defineRouting } from 'next-intl/routing';

export const locales = ['uz', 'en', 'ru'] as const;
export type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'uz';

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});
