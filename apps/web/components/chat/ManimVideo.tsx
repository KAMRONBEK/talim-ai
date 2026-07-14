'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ManimPayload } from '@talim/types';
import { getApiBaseUrl } from '@/lib/api';
import { jobStream } from '@/lib/jobStream';
import { useAuthStore } from '@/store/useAuthStore';
import { useJobStreamStore } from '@/store/useJobStreamStore';

/** Renders take up to ~120s normally; past this we stop polling and show a timeout. */
const RENDER_DEADLINE_MS = 5 * 60_000;

export function ManimVideo({ payload }: { payload: ManimPayload }) {
  const t = useTranslations('chat');
  const token = useAuthStore((s) => s.token);
  const connected = useJobStreamStore((s) => s.connected);
  const [status, setStatus] = useState(payload.status);
  const [timedOut, setTimedOut] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'svg'>('video');
  const deadlineRef = useRef<number | null>(null);

  const assetPath =
    payload.url?.startsWith('http')
      ? payload.url
      : payload.jobId
        ? `${getApiBaseUrl()}/chat/visual/manim/${payload.jobId}/asset`
        : null;

  useEffect(() => {
    setStatus(payload.status);
  }, [payload.status]);

  // Push-primary: the render job publishes a user-scoped manim.status event; react
  // immediately instead of waiting for the next poll tick. Crucially, FAILED is only
  // knowable via the event — a failed render 404s identically to a pending one.
  useEffect(() => {
    if (status !== 'pending' || !payload.jobId) return;
    return jobStream.subscribe((ev) => {
      if (ev.type !== 'manim.status' || ev.jobId !== payload.jobId) return;
      if (ev.status === 'READY') {
        setTimedOut(false);
        setStatus('ready'); // triggers the asset fetch below
      } else {
        setStatus('failed');
      }
    });
  }, [status, payload.jobId]);

  // Safety-net poll: slow while the SSE stream is connected, fast fallback while
  // disconnected, and hard-bounded so an unreported failure can't poll forever.
  useEffect(() => {
    if (status !== 'pending' || timedOut || !payload.jobId || !token) return;
    if (deadlineRef.current === null) deadlineRef.current = Date.now() + RENDER_DEADLINE_MS;

    const interval = setInterval(async () => {
      if (Date.now() > (deadlineRef.current ?? 0)) {
        setTimedOut(true);
        return;
      }
      try {
        const res = await fetch(
          `${getApiBaseUrl()}/chat/visual/manim/${payload.jobId}/asset`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) setStatus('ready');
      } catch {
        // keep polling
      }
    }, connected ? 15_000 : 3_000);

    return () => clearInterval(interval);
  }, [status, timedOut, payload.jobId, token, connected]);

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

  if (status === 'failed' || timedOut) {
    return (
      <div className="my-2 rounded-md border border-destructive/40 bg-muted p-3 text-xs text-destructive">
        {t('manimError')}: {timedOut ? t('manimTimeout') : (payload.error ?? t('manimFailed'))}
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
