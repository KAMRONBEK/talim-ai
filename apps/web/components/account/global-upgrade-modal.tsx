'use client';

import { useUpgradeModal } from '@/store/useUpgradeModal';
import { UpgradeDialog } from '@/components/account/upgrade-dialog';

/** The single, app-wide instance of the subscription-promotion modal. Mounted
 *  once in Providers; opened from anywhere via `useUpgradeModal().openUpgrade()`. */
export function GlobalUpgradeModal() {
  const { open, headline, subhead, close } = useUpgradeModal();
  return <UpgradeDialog open={open} onClose={close} headline={headline} subhead={subhead} />;
}
