'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card, CardContent, CardHeader, Input, Label } from '@talim/ui';
import { useMyTutorRequest, useRequestTutor } from '@/hooks/useTutorRequest';
import { useAuthStore } from '@/store/useAuthStore';

export function BecomeTutorCard() {
  const t = useTranslations('becomeTutor');
  const role = useAuthStore((s) => s.user?.role);
  const { data: request, isLoading } = useMyTutorRequest();
  const requestTutor = useRequestTutor();
  const [orgName, setOrgName] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Only individual learners can request tutor access.
  if (role !== 'INDIVIDUAL' || isLoading) return null;

  const pending = request?.status === 'PENDING';
  const rejected = request?.status === 'REJECTED';

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('desc')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending ? (
          <p className="rounded-md bg-muted px-3 py-2 text-sm">{t('pending')}</p>
        ) : (
          <>
            {rejected && <p className="text-sm text-destructive">{t('rejected')}</p>}
            <div className="space-y-1">
              <Label htmlFor="orgName">{t('orgNameLabel')}</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder={t('orgNamePlaceholder')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tutorNote">{t('noteLabel')}</Label>
              <Input
                id="tutorNote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('notePlaceholder')}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              disabled={requestTutor.isPending || orgName.trim().length < 2}
              onClick={async () => {
                setError(null);
                try {
                  await requestTutor.mutateAsync({
                    orgName: orgName.trim(),
                    note: note.trim() || undefined,
                  });
                } catch (err) {
                  setError(
                    (err as { response?: { data?: { message?: string } } })?.response?.data
                      ?.message ?? t('error'),
                  );
                }
              }}
            >
              {requestTutor.isPending ? t('submitting') : t('submit')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
