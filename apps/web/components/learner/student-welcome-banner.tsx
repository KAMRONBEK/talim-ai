'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { dismissOnboarding, isOnboardingPending } from '@/lib/onboarding';

export function StudentWelcomeBanner() {
  const t = useTranslations('learner.onboarding');
  const user = useAuthStore((s) => s.user);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setVisible(isOnboardingPending(user.id));
    }
  }, [user?.id]);

  if (!visible || !user) return null;

  const handleDismiss = () => {
    dismissOnboarding(user.id);
    setVisible(false);
  };

  return (
    <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <h2 className="font-semibold">{t('title')}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t('desc')}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/learner/settings">
          <Button size="sm">{t('cta')}</Button>
        </Link>
        <Button size="sm" variant="outline" onClick={handleDismiss}>
          {t('dismiss')}
        </Button>
      </div>
    </section>
  );
}
