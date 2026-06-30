import type { Metadata } from 'next';
import { inter } from '@talim/ui/fonts/inter';
import { display } from '@talim/ui/fonts/display';
import { newsreader } from '@talim/ui/fonts/newsreader';
import { jakarta } from '@talim/ui/fonts/jakarta';
import { grotesk } from '@talim/ui/fonts/grotesk';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Talim AI',
  description: 'AI-powered self-learning platform',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${newsreader.variable} ${grotesk.variable} ${inter.variable} ${display.variable} ${jakarta.className} font-sans`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
