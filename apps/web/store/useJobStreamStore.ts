import { create } from 'zustand';

/**
 * Whether the SSE job-events stream is currently connected. Polling hooks read this to
 * stay push-primary: a slow safety-net poll runs only while disconnected.
 */
interface JobStreamState {
  connected: boolean;
  setConnected: (connected: boolean) => void;
}

export const useJobStreamStore = create<JobStreamState>((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected }),
}));
