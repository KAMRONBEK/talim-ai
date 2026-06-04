import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Talim AI — Har qanday narsani o\'zingizning yo\'lingiz bilan o\'rganing',
  description: 'PDF, video va slaydlar uchun AI yordamida o\'z-o\'zini o\'rgatish platformasi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
