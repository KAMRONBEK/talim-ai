'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@talim/ui';
import { useUpdateProfile } from '@/hooks/useAccount';
import { useAuthStore } from '@/store/useAuthStore';

export function ProfileCard() {
  const t = useTranslations('account.profile');
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    try {
      await updateProfile.mutateAsync({ name: name.trim() });
      setMessage(t('success'));
    } catch {
      setMessage(t('error'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
      <div>
        <h2 className="font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('desc')}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="profileName">{t('name')}</Label>
        <Input
          id="profileName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={1}
        />
      </div>
      {/* Email-less students carry a synthetic username@students.talim.local address; show
          their username elsewhere instead of this placeholder, not the raw synthetic email. */}
      {user?.email && !user.email.endsWith('@students.talim.local') && (
        <div className="space-y-1">
          <Label>{t('email')}</Label>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      )}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <Button type="submit" disabled={updateProfile.isPending}>
        {updateProfile.isPending ? t('saving') : t('save')}
      </Button>
    </form>
  );
}
