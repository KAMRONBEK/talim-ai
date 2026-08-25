'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { getPostLoginPath } from '@/lib/auth-routing';
import type { User } from '@talim/types';

function ImpersonateInner() {
  const t = useTranslations('impersonate');
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setToken = useAuthStore((s) => s.setToken);
  const logout = useAuthStore((s) => s.logout);
  const [error, setError] = useState('');
  // Guard against React 18 StrictMode double-invoking the effect (and against
  // re-runs) so we only exchange the token for a session once.
  //
  // This ref is the ONLY thing that is once-only. The token itself is not: it is
  // a stateless 30-minute JWT that `authMiddleware` accepts like any other, so it
  // stays a working credential for the rest of its window no matter how many times
  // it is used (measured: `GET /auth/me` 200 on 5/5 replays). Do not read this
  // guard as "the token is spent" — see GHSA-v8gx-9qfw-92f4.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setError(t('missingToken'));
      return;
    }

    // Store the token first so the api client attaches it as the bearer on the
    // /auth/me request below (the request interceptor reads it from the store).
    setToken(token);

    void (async () => {
      try {
        const { data } = await api.get<{ user: User; token?: string }>('/auth/me');
        setAuth(data.user, data.token ?? token);
        router.replace(getPostLoginPath(data.user.role));
      } catch (err: unknown) {
        // Clear the bad token we just stored so it can't linger in localStorage.
        logout();
        const status = (err as { response?: { status?: number } })?.response?.status;
        setError(status === 401 ? t('invalidToken') : t('serverError'));
      }
    })();
  }, [searchParams, setToken, setAuth, logout, router, t]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          {t('backToLogin')}
        </Link>
      </div>
    );
  }

  return <SigningIn />;
}

function SigningIn() {
  const t = useTranslations('impersonate');
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">{t('signingIn')}</p>
    </div>
  );
}

export default function ImpersonatePage() {
  return (
    <Suspense fallback={<SigningIn />}>
      <ImpersonateInner />
    </Suspense>
  );
}
