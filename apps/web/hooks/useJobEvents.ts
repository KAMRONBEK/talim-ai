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
        qc.invalidateQueries({ queryKey: ['flashcards'] });
        qc.invalidateQueries({ queryKey: ['content-transcript'] });
        qc.invalidateQueries({ queryKey: ['tenant', 'question-banks'] });
        qc.invalidateQueries({ queryKey: ['quiz'] });
        qc.invalidateQueries({ queryKey: ['quiz-history'] });
        // Mirror the content.status READY per-event invalidations: a re-ingest that
        // finished while disconnected also replaced sections and summaries.
        qc.invalidateQueries({ queryKey: ['sections'] });
        qc.invalidateQueries({ queryKey: ['section'] });
        qc.invalidateQueries({ queryKey: ['summary'] });
        // Live leaderboards may have advanced while we were disconnected (partial-match
        // covers both the tenant and learner assessment query trees).
        qc.invalidateQueries({ queryKey: ['tenant', 'assessments'] });
        qc.invalidateQueries({ queryKey: ['learner', 'assessments'] });
        // manim.status has no react-query key (the pending visual lives in the chat
        // session query, not a manim-scoped one), so it can't be caught up like the
        // others — and a FAILED render 404s identically to a pending one, so ManimVideo's
        // asset poll can't detect it. The render job patches the ready/failed status into
        // the ChatMessage, so refetch the chat session (the key useChatSession/ChatWindow
        // actually read): a manim event missed during the disconnect is recovered from there.
        qc.invalidateQueries({ queryKey: ['chat-session'] });
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
    case 'flashcards.status':
      qc.invalidateQueries({ queryKey: ['flashcards', ev.contentId] });
      break;
    case 'quiz.status':
      qc.invalidateQueries({ queryKey: ['quiz', ev.quizId] });
      if (ev.contentId) qc.invalidateQueries({ queryKey: ['quiz-history', ev.contentId] });
      break;
    case 'transcript.status':
      qc.invalidateQueries({ queryKey: ['content-transcript', ev.contentId] });
      break;
    case 'bank.status':
      // Refresh both the bank's question list and the banks index (question counts /
      // generation state shown in the tenant assessments builder).
      qc.invalidateQueries({ queryKey: ['tenant', 'question-banks', ev.bankId, 'questions'] });
      qc.invalidateQueries({ queryKey: ['tenant', 'question-banks'] });
      break;
    // manim.status is intentionally NOT handled here: the pending visual lives in the
    // Zustand chat store (not react-query), so ManimVideo subscribes to jobStream
    // directly and reacts to its own jobId.
    case 'leaderboard.update':
      // Refresh both the tenant-owner board and the learner board for this assessment
      // (keys mirror useAssessmentLeaderboard / useLearnerLeaderboard in useAssessments).
      qc.invalidateQueries({ queryKey: ['tenant', 'assessments', ev.assessmentId, 'leaderboard'] });
      qc.invalidateQueries({ queryKey: ['learner', 'assessments', ev.assessmentId, 'leaderboard'] });
      break;
  }
}
