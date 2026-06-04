'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LandingPage } from '@/components/marketing/landing-page';
import { useAuthStore } from '@/store/useAuthStore';

export default function HomePage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && token) {
      router.replace('/dashboard');
    }
  }, [mounted, token, router]);

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
