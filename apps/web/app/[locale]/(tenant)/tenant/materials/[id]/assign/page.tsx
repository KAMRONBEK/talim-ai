'use client';

import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { AssignStudentsPanel } from '@/components/tenant/assign-students-panel';
import { useTenantContent } from '@/hooks/useTenantContent';

export default function AssignContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('tenant');
  const { data: content } = useTenantContent(id);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link
        href={`/content/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('assign.back', { title: content?.title ?? '' })}
      </Link>
      <AssignStudentsPanel contentId={id} />
    </div>
  );
}
