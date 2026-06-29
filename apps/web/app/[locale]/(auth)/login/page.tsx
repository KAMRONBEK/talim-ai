'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button, Card, CardContent, Input, Label } from '@talim/ui';
import { AuthShell } from '@/components/auth/auth-shell';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import type { AuthResponse } from '@talim/types';
import { getPostLoginPath } from '@/lib/auth-routing';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!mounted || !token || !user) return;
    // Admins belong in the admin panel, not this app. A persisted admin token
    // would otherwise redirect into an INDIVIDUAL-only route and loop forever.
    if (user.role === 'ADMIN') {
      logout();
      setError(t('adminNotAllowed'));
      return;
    }
    router.replace(getPostLoginPath(user.role));
  }, [mounted, token, user, router, logout, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      if (data.user.role === 'ADMIN') {
        setError(t('adminNotAllowed'));
        return;
      }
      setAuth(data.user, data.token);
      router.replace(getPostLoginPath(data.user.role));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === 401
          ? t('invalidCredentials')
          : status === 403
            ? t('accountDeactivated')
            : status === 429
              ? t('tooManyAttempts')
              : t('serverError'),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">{tCommon('loading')}</p>
      </div>
    );
  }

  return (
    <AuthShell>
      <Card className="animate-scale-in shadow-elevated">
        <CardContent className="space-y-6 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{t('welcomeBack')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('signInContinue')}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailOrUsername')}</Label>
              <Input
                id="email"
                type="text"
                autoCapitalize="none"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? t('signingIn') : t('signIn')}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              {t('createOne')}
            </Link>
            <span className="mt-2 block">
              {t('tutorAccount')}{' '}
              <Link href="/register" className="font-medium text-primary hover:underline">
                {t('createOne')}
              </Link>
            </span>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
