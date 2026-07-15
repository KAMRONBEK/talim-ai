import { EventEmitter } from 'node:events';
import type { JobEvent, SeqJobEvent } from '@talim/types';

/**
 * In-process hub for async-job completion events, keyed by `userId`. The single API
 * process is also the Bull worker (see apps/api/CLAUDE.md), so a worker can publish
 * directly into this emitter and the SSE endpoint (`GET /events`) forwards to that
 * user's connected tabs. A per-user ring buffer backs Last-Event-ID replay across brief
 * reconnects. The class is the swap-seam for a future Redis pub/sub bus if the API ever
 * runs multiple instances.
 */
const RING = 50; // events retained per user for replay
const RING_TTL_MS = 60_000;

interface UserState {
  seq: number;
  buffer: { e: SeqJobEvent; t: number }[];
}

class InProcessJobEventBus {
  private emitter = new EventEmitter();
  private state = new Map<string, UserState>();

  constructor() {
    this.emitter.setMaxListeners(0); // many concurrent SSE subscribers across users
  }

  publish(userId: string, event: JobEvent): void {
    const st = this.state.get(userId) ?? { seq: 0, buffer: [] };
    st.seq += 1;
    const seqEvent: SeqJobEvent = { seq: st.seq, event };
    st.buffer.push({ e: seqEvent, t: Date.now() });
    if (st.buffer.length > RING) st.buffer.shift();
    this.state.set(userId, st);
    // A failing subscriber (e.g. a dead SSE socket whose cleanup didn't fire) must NEVER
    // propagate into the publisher — a job's success cannot depend on event delivery.
    try {
      this.emitter.emit(userId, seqEvent);
    } catch (err) {
      console.error('jobEvents.publish: subscriber threw', err);
    }
  }

  subscribe(userId: string, fn: (e: SeqJobEvent) => void): () => void {
    this.emitter.on(userId, fn);
    return () => this.emitter.off(userId, fn);
  }

  /**
   * Events after `lastEventId` for replay on reconnect. Returns `null` when the gap has
   * already fallen out of the ring/TTL — the caller should tell the client to resync
   * (full invalidation) instead of replaying a partial history.
   */
  replay(userId: string, lastEventId: number): SeqJobEvent[] | null {
    const st = this.state.get(userId);
    if (!st) return [];
    const fresh = st.buffer.filter((b) => Date.now() - b.t <= RING_TTL_MS).map((b) => b.e);
    const first = fresh[0];
    if (!first) return [];
    if (first.seq > lastEventId + 1) return null; // missed events evicted → resync
    return fresh.filter((e) => e.seq > lastEventId);
  }
}

export const jobEvents = new InProcessJobEventBus();
type JobEventBus = InProcessJobEventBus;
