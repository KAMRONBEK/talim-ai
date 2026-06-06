'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ManimPayload } from '@talim/types';
import { getApiBaseUrl } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export function ManimVideo({ payload }: { payload: ManimPayload }) {
  const t = useTranslations('chat');
  const token = useAuthStore((s) => s.token);
  const [status, setStatus] = useState(payload.status);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'svg'>('video');

  const assetPath =
    payload.url?.startsWith('http')
      ? payload.url
      : payload.jobId
        ? `${getApiBaseUrl()}/chat/visual/manim/${payload.jobId}/asset`
        : null;

  useEffect(() => {
    setStatus(payload.status);
  }, [payload.status]);

  useEffect(() => {
    if (status !== 'pending' || !payload.jobId || !token) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${getApiBaseUrl()}/chat/visual/manim/${payload.jobId}/asset`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) setStatus('ready');
      } catch {
        // keep polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, payload.jobId, token]);

  useEffect(() => {
    if (status !== 'ready' || !assetPath || !token) return;

    let revoked = false;
    fetch(assetPath, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        const ct = res.headers.get('content-type') ?? '';
        setMediaType(ct.includes('svg') ? 'svg' : 'video');
        return res.blob();
      })
      .then((blob) => {
        if (!revoked) setBlobUrl(URL.createObjectURL(blob));
      })
      .catch(() => setStatus('failed'));

    return () => {
      revoked = true;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [status, assetPath, token]);

  if (status === 'failed') {
    return (
      <div className="my-2 rounded-md border border-destructive/40 bg-muted p-3 text-xs text-destructive">
        {t('manimError')}: {payload.error ?? t('manimFailed')}
      </div>
    );
  }

  if (status === 'pending' || (status === 'ready' && !blobUrl)) {
    return (
      <div className="my-2 flex h-[200px] items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
        {t('manimRendering')}
      </div>
    );
  }

  return (
    <div className="my-2 rounded-md border bg-card p-2" aria-label={t('manimLabel')}>
      {mediaType === 'svg' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={blobUrl!} alt={t('manimLabel')} className="mx-auto max-h-[280px] w-full object-contain" />
      ) : (
        <video src={blobUrl!} controls className="mx-auto max-h-[280px] w-full rounded-md" />
      )}
    </div>
  );
}
