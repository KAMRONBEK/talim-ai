import { create } from 'zustand';

/**
 * Global state for the single, app-wide subscription-promotion modal
 * (UpgradeDialog). Any quota / plan-limit error can open it via `openUpgrade`,
 * so the promotion modal is consistent everywhere instead of each call site
 * mounting its own dialog. Mounted once in `Providers` via GlobalUpgradeModal.
 */
interface UpgradeModalState {
  open: boolean;
  headline?: string;
  subhead?: string;
  openUpgrade: (opts?: { headline?: string; subhead?: string }) => void;
  close: () => void;
}

export const useUpgradeModal = create<UpgradeModalState>((set) => ({
  open: false,
  headline: undefined,
  subhead: undefined,
  openUpgrade: (opts) =>
    set({ open: true, headline: opts?.headline, subhead: opts?.subhead }),
  // Clear the headline/subhead too so a stale message from a previous limit can't
  // flash on a later open() that doesn't set its own (e.g. the billing-card CTA).
  close: () => set({ open: false, headline: undefined, subhead: undefined }),
}));
