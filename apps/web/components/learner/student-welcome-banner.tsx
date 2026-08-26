'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { dismissOnboarding } from '@/lib/onboarding';

export function StudentWelcomeBanner() {
  const t = useTranslations('learner.onboarding');
  const user = useAuthStore((s) => s.user);
  const [dismissed, setDismissed] = useState(false);

  // Derived during render, not in an effect. Initialising to false and flipping it on
  // mount meant this banner was absent from the first paint and then appeared — pushing
  // the entire dashboard down every single time it was due, which is most of #67's
  // 517px. LearnerShell renders inside RoleGuard/AuthGuard, both of which already wait
  // for the auth store to hydrate, so `user` is populated on the first render that
  // reaches here and localStorage is safe to read.
  // Gated on mustChangePassword ALONE. This banner says "your teacher created this
  // account, change the temporary password" — which is only true when a tutor or admin
  // issued one, and mustChangePassword is exactly that signal.
  //
  // The old `|| isOnboardingPending(user.id)` fallback returns true whenever no
  // localStorage key exists, i.e. by default for everyone, so a student who signed
  // themselves up with a class code was told somebody else made their account and sent
  // to Settings to change a temporary password that never existed (#56).
  const due = Boolean(user?.mustChangePassword);

  if (!due || dismissed || !user) return null;

  const handleDismiss = () => {
    dismissOnboarding(user.id);
    setDismissed(true);
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-accent-secondary/40 bg-accent-secondary/10 p-5 shadow-soft sm:flex-row sm:items-start">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-secondary text-xl text-accent-secondary-foreground">👋</div>
      <div className="flex-1">
        <h2 className="font-display text-lg font-semibold text-foreground">{t('title')}</h2>
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
