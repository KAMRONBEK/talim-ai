import { create } from 'zustand';
import type { Content } from '@talim/types';

interface ContentState {
  activeContent: Content | null;
  setActiveContent: (content: Content | null) => void;
}

export const useContentStore = create<ContentState>((set) => ({
  activeContent: null,
  setActiveContent: (content) => set({ activeContent: content }),
}));
