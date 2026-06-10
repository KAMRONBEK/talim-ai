import type { Metadata } from 'next';
import { inter } from '@talim/ui/fonts/inter';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Talim Admin',
  description: 'Talim AI platform administration',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${inter.className} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
