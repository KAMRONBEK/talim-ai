'use client';

import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button, Card, CardContent, Input, Label } from '@talim/ui';
import { AuthShell } from '@/components/auth/auth-shell';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import type { AuthResponse } from '@talim/types';
import { getPostLoginPath } from '@/lib/auth-routing';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && token && user) router.replace(getPostLoginPath(user.role));
  }, [mounted, token, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        name,
        email,
        password,
        ...(joinCode.trim() ? { joinCode: joinCode.trim().toUpperCase() } : {}),
      });
      setAuth(data.user, data.token);
      router.replace(getPostLoginPath(data.user.role));
    } catch (err) {
      // Map the API's English error responses to localized strings by status code
      // (the same pattern as the login page) so uz/ru users don't see raw English.
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === 409
          ? t('emailTaken')
          : status === 404
            ? t('invalidJoinCode')
            : status === 429
              ? t('tooManyAttempts')
              : t('registerFailed'),
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
      <Card className="animate-scale-in border-0 bg-transparent shadow-none">
        <CardContent className="space-y-6 p-0">
          <div>
            <h1 className="font-display text-2xl font-semibold">{t('createAccount')}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{t('registerContinue')}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {t('name')}
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 rounded-xl px-4"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {t('email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl px-4"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {t('password')}
              </Label>
              <Input
                id="password"
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl px-4"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="joinCode"
                className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {t('classCode')}
              </Label>
              <div className="relative">
                <Shield className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-secondary" />
                <Input
                  id="joinCode"
                  value={joinCode}
                  autoCapitalize="characters"
                  placeholder="ABC123"
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="h-11 rounded-xl border-dashed pl-10 pr-4 tracking-[0.12em]"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('classCodeHint')}</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" variant="gradient" className="h-12 w-full text-base" disabled={loading}>
              {loading ? t('registering') : t('register')}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            {t('haveAccount')}{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t('signIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
