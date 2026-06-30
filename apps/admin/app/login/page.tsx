'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, Input, Label } from '@talim/ui';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { LogoMark } from '@/components/logo';
import type { AuthResponse } from '@talim/types';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && token && user?.role === 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [mounted, token, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      if (data.user.role !== 'ADMIN') {
        logout();
        setError('This account is not authorized for admin access.');
        return;
      }
      setAuth(data.user, data.token);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 401 ? 'Invalid email or password.' : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || (token && user?.role === 'ADMIN')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-brand-radial" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-girih opacity-50 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]"
      />
      <div className="relative z-10 mb-8 flex items-center gap-2.5">
        <LogoMark className="h-10 w-10 shadow-glow" />
        <span className="font-display text-xl font-semibold">Talim Admin</span>
      </div>
      <Card className="relative z-10 w-full max-w-md border-border shadow-elevated">
        <CardContent className="space-y-6 p-8">
          <div className="text-center">
            <h1 className="font-display text-2xl font-semibold">Admin sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Platform operators only</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
