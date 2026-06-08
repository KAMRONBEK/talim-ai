'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { LandingPage } from '@/components/marketing/landing-page';
import { useAuthStore } from '@/store/useAuthStore';
import { getPostLoginPath } from '@/lib/auth-routing';

export default function HomePage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && token && user) {
      router.replace(getPostLoginPath(user.role));
    }
  }, [mounted, token, user, router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (token) return null;

  return <LandingPage />;
}
