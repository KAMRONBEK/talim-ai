'use client';

import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { JobEvent } from '@talim/types';
import { jobStream } from '@/lib/jobStream';
import { useAuthStore } from '@/store/useAuthStore';
import { useJobStreamStore } from '@/store/useJobStreamStore';

/**
 * Opens the single per-tab SSE job-events stream and turns each event into a precise
 * react-query invalidation, replacing the old 3–5s `refetchInterval` polling. On every
 * (re)connect it also fires a catch-up invalidation so anything that finished while the
 * stream was down is picked up. Mounted once in providers.
 */
export function useJobEvents(): void {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const setConnected = useJobStreamStore((s) => s.setConnected);

  useEffect(() => {
    if (!token) return;
    const offEvt = jobStream.subscribe((ev) => applyEvent(qc, ev));
    const offConn = jobStream.onConnected((connected) => {
      setConnected(connected);
      if (connected) {
        // Catch-up: anything that completed while we were disconnected.
        qc.invalidateQueries({ queryKey: ['contents'] });
        qc.invalidateQueries({ queryKey: ['content'] });
        qc.invalidateQueries({ queryKey: ['tenant', 'contents'] });
        qc.invalidateQueries({ queryKey: ['tenant', 'content'] });
        qc.invalidateQueries({ queryKey: ['podcast'] });
        qc.invalidateQueries({ queryKey: ['video'] });
        qc.invalidateQueries({ queryKey: ['slides'] });
      }
    });
    jobStream.start(token);
    return () => {
      offEvt();
      offConn();
      jobStream.stop();
    };
  }, [token, qc, setConnected]);
}

function applyEvent(qc: QueryClient, ev: JobEvent): void {
  switch (ev.type) {
    case 'content.status':
      // Partial-match keys: ['content', id] covers ['content', id, base] for both routes.
      qc.invalidateQueries({ queryKey: ['content', ev.contentId] });
      qc.invalidateQueries({ queryKey: ['contents'] });
      qc.invalidateQueries({ queryKey: ['tenant', 'content', ev.contentId] });
      qc.invalidateQueries({ queryKey: ['tenant', 'contents'] });
      if (ev.status === 'READY') {
        qc.invalidateQueries({ queryKey: ['slides', ev.contentId] });
        qc.invalidateQueries({ queryKey: ['sections', ev.contentId] });
        qc.invalidateQueries({ queryKey: ['summary', ev.contentId] });
      }
      break;
    case 'podcast.status':
      qc.invalidateQueries({ queryKey: ['podcast', ev.contentId] });
      break;
    case 'video.status':
      qc.invalidateQueries({ queryKey: ['video', ev.contentId] });
      break;
    case 'slides.status':
      qc.invalidateQueries({ queryKey: ['slides', ev.contentId] });
      break;
    case 'quiz.status':
      qc.invalidateQueries({ queryKey: ['quiz', ev.quizId] });
      if (ev.contentId) qc.invalidateQueries({ queryKey: ['quiz-history', ev.contentId] });
      break;
  }
}
