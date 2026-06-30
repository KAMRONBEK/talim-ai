'use client';

import { useTranslations } from 'next-intl';
import { splitSummaryParagraphs } from '@/lib/format-summary';

export function SummaryText({
  text,
  className = 'text-[15px] leading-relaxed text-foreground/90',
}: {
  text: string;
  className?: string;
}) {
  const t = useTranslations('content');
  const paragraphs = splitSummaryParagraphs(text);

  if (paragraphs.length === 0) {
    return <p className={className}>{t('summaryNotAvailable')}</p>;
  }

  return (
    <div className="max-w-prose space-y-5">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={className}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
