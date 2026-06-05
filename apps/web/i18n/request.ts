import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';
import uzMessages from '../messages/uz.json';
import enMessages from '../messages/en.json';
import ruMessages from '../messages/ru.json';

const messagesByLocale = {
  uz: uzMessages,
  en: enMessages,
  ru: ruMessages,
} satisfies Record<Locale, typeof uzMessages>;

function parseLocale(value: string | undefined | null): Locale {
  if (value && (routing.locales as readonly string[]).includes(value)) {
    return value as Locale;
  }
  return routing.defaultLocale;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const raw = await requestLocale;
  const locale = parseLocale(raw);

  return {
    locale,
    messages: messagesByLocale[locale],
  };
});
