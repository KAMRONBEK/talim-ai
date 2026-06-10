'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@talim/ui';
import { useChangePassword } from '@/hooks/useAccount';

export function PasswordCard() {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Password updated.');
    } catch {
      setMessage('Could not update password. Check your current password.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
      <div>
        <h2 className="font-semibold">Password</h2>
        <p className="text-sm text-muted-foreground">
          You may keep the temporary password, but changing it is recommended.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={8}
          required
        />
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <Button type="submit" disabled={changePassword.isPending}>
        Save password
      </Button>
    </form>
  );
}
