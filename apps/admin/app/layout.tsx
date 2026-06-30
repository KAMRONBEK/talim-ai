import type { Metadata } from 'next';
import { inter } from '@talim/ui/fonts/inter';
import { newsreader } from '@talim/ui/fonts/newsreader';
import { jakarta } from '@talim/ui/fonts/jakarta';
import { grotesk } from '@talim/ui/fonts/grotesk';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Talim Admin',
  description: 'Talim AI platform administration',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${newsreader.variable} ${grotesk.variable} ${inter.variable} ${jakarta.className} font-sans`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
