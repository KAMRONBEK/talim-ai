'use client';

import { PasswordCard } from '@/components/account/password-card';

export default function LearnerSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your student account.</p>
      </div>
      <PasswordCard />
    </div>
  );
}
