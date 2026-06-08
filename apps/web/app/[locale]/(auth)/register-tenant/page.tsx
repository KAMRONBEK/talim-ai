'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button, Card, CardContent, Input, Label } from '@talim/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import type { AuthResponse } from '@talim/types';
import { getPostLoginPath } from '@/lib/auth-routing';

export default function RegisterTenantPage() {
  const t = useTranslations('auth');
  const tTenant = useTranslations('tenant');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && token && user) router.replace(getPostLoginPath(user.role));
  }, [mounted, token, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/register-tenant', {
        orgName,
        name,
        email,
        password,
      });
      setAuth(data.user, data.token);
      router.replace(getPostLoginPath(data.user.role));
    } catch {
      setError(t('registerFailed'));
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageSwitcher compact />
        <ThemeToggle compact />
      </div>
      <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-bold">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          T
        </span>
        Talim AI
      </Link>
      <Card className="w-full max-w-md border shadow-lg">
        <CardContent className="space-y-6 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{tTenant('register.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{tTenant('register.desc')}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">{tTenant('settings.orgName')}</Label>
              <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('registering') : tTenant('register.submit')}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/register" className="font-medium text-primary hover:underline">
              {tTenant('register.individual')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
