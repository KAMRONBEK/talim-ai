import { create } from 'zustand';

/** Why a transcript failed, as reported by the job event. */
export type TranscriptFailureReason = 'TOO_LONG';

interface TranscriptFailureState {
  byContentId: Record<string, TranscriptFailureReason>;
  setReason: (contentId: string, reason: TranscriptFailureReason) => void;
  clearReason: (contentId: string) => void;
}

/**
 * Remembers WHY a transcript failed, for the session.
 *
 * The transcript endpoint reports only `status: 'failed'` — `Content` has no failure-reason
 * column — so the viewer could only ever show one generic line. A video that is simply too long
 * to transcribe then read as a malfunction worth retrying, which it is not: retrying re-downloads
 * the whole audio to fail identically.
 *
 * Deliberately in-memory rather than persisted or migrated: the reason arrives on the SSE event
 * while the learner is looking at the page, which is exactly when it matters. After a reload they
 * fall back to the generic message, which is no worse than today.
 */
export const useTranscriptFailureStore = create<TranscriptFailureState>((set) => ({
  byContentId: {},
  setReason: (contentId, reason) =>
    set((state) => ({ byContentId: { ...state.byContentId, [contentId]: reason } })),
  clearReason: (contentId) =>
    set((state) => {
      if (!(contentId in state.byContentId)) return state;
      const next = { ...state.byContentId };
      delete next[contentId];
      return { byContentId: next };
    }),
}));
