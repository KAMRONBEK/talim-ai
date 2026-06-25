'use client';

import { use, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

/**
 * The standalone chat route folded into the unified workspace — chat is now a tab
 * in the Learn panel beside the never-unmounting player. Kept as a redirect so old
 * links / bookmarks (and the sidebar "AI tutor" action) still work.
 */
export default function ChatRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations('common');

  useEffect(() => {
    router.replace(`/content/${id}?panel=chat`);
  }, [id, router]);

  return <p className="p-8 text-muted-foreground">{t('loading')}</p>;
}
