import { z } from 'zod';
import type { Request } from 'express';
import { DEFAULT_LOCALE, parseAppLocale, type AppLocale } from '@talim/types';

export const localeSchema = z.enum(['uz', 'en', 'ru']).default(DEFAULT_LOCALE);

export function resolveLocale(
  req: Request,
  options?: { body?: unknown; queryKey?: string },
): AppLocale {
  const body = options?.body as { locale?: string } | undefined;
  if (body?.locale) return parseAppLocale(body.locale);

  const queryKey = options?.queryKey ?? 'locale';
  const queryVal = req.query[queryKey];
  if (typeof queryVal === 'string') return parseAppLocale(queryVal);

  const header = req.headers['accept-language'];
  if (typeof header === 'string') {
    const first = header.split(',')[0]?.trim().split('-')[0]?.toLowerCase();
    if (first) return parseAppLocale(first);
  }

  return DEFAULT_LOCALE;
}
