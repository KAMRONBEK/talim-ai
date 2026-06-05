import { splitSummaryParagraphs } from '@/lib/format-summary';

export function SummaryText({
  text,
  className = 'text-sm leading-relaxed',
}: {
  text: string;
  className?: string;
}) {
  const paragraphs = splitSummaryParagraphs(text);

  if (paragraphs.length === 0) {
    return <p className={className}>Xulosa mavjud emas.</p>;
  }

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={className}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
