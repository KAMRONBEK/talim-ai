'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

const PdfViewer = dynamic(
  () => import('./PdfViewer').then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => <PdfViewerLoading />,
  },
);

function PdfViewerLoading() {
  const t = useTranslations('content');
  return <p className="p-4 text-sm text-muted-foreground">{t('pdfLoading')}</p>;
}

export { PdfViewer };
