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
      <Card className="animate-scale-in shadow-elevated">
        <CardContent className="space-y-6 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{t('createAccount')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('registerContinue')}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="joinCode">{t('classCode')}</Label>
              <Input
                id="joinCode"
                value={joinCode}
                autoCapitalize="characters"
                placeholder="ABC123"
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t('classCodeHint')}</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
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
