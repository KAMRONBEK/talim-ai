'use client';

import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
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
      <Link href={`/content/${id}`} className="text-sm text-muted-foreground hover:underline">
        {t('assign.back', { title: content?.title ?? '' })}
      </Link>
      <AssignStudentsPanel contentId={id} />
    </div>
  );
}
