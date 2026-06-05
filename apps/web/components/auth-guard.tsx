'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const t = useTranslations('common');
  const token = useAuthStore((s) => s.token);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!token) {
      router.replace('/login');
    }
  }, [token, mounted, router]);

  if (!mounted || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  return <>{children}</>;
}
