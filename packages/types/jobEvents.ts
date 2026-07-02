/**
 * Push events for async job completion, streamed over SSE (`GET /events`) so the web
 * app can invalidate the matching react-query keys instead of polling. Events are
 * id-only (no content payload) — the client refetches through the normal REST endpoint,
 * which re-runs `assertCanAccessContent`, so the channel never leaks data.
 */
export type JobEventStatus = 'READY' | 'FAILED' | 'PROCESSING' | 'GENERATING';

export type JobEvent =
  | { type: 'content.status'; contentId: string; status: 'READY' | 'FAILED' | 'PROCESSING' }
  | { type: 'podcast.status'; contentId: string; status: 'READY' | 'FAILED' | 'GENERATING'; episodeId?: string }
  | { type: 'video.status'; contentId: string; sectionId?: string; status: 'READY' | 'FAILED' | 'GENERATING' }
  | { type: 'slides.status'; contentId: string; sectionId?: string; status: 'READY' | 'FAILED' }
  | {
      type: 'flashcards.status';
      contentId: string;
      sectionId?: string;
      status: 'READY' | 'FAILED' | 'GENERATING';
    }
  | { type: 'quiz.status'; quizId: string; contentId?: string; status: 'READY' | 'FAILED' }
  | { type: 'leaderboard.update'; assessmentId: string; tenantId: string };

/** Wire frame: carries a monotonic per-user sequence id for Last-Event-ID replay. */
export interface SeqJobEvent {
  seq: number;
  event: JobEvent;
}
