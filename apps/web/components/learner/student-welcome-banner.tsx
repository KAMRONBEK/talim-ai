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
      // Prefer the server-driven flag (works across devices); fall back to the
      // legacy per-device localStorage flag.
      setVisible(Boolean(user.mustChangePassword) || isOnboardingPending(user.id));
    }
  }, [user?.id, user?.mustChangePassword]);

  if (!visible || !user) return null;

  const handleDismiss = () => {
    dismissOnboarding(user.id);
    setVisible(false);
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-soft sm:flex-row sm:items-start">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-secondary/20 text-xl">👋</div>
      <div className="flex-1">
        <h2 className="font-display font-semibold">{t('title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('desc')}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/learner/settings">
            <Button variant="gradient" size="sm">{t('cta')}</Button>
          </Link>
          <Button size="sm" variant="outline" onClick={handleDismiss}>
            {t('dismiss')}
          </Button>
        </div>
      </div>
    </section>
  );
}
