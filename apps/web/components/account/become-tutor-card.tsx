'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { GraduationCap } from 'lucide-react';
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
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-secondary/15 text-accent-secondary">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">{t('title')}</h2>
            <p className="text-sm text-muted-foreground">{t('desc')}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending ? (
          <p className="rounded-xl border border-info/30 bg-info-muted/40 px-4 py-3 text-sm text-info">{t('pending')}</p>
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
              variant="gradient"
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
