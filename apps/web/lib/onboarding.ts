const PREFIX = 'talim-onboarding-';

function getOnboardingKey(userId: string): string {
  return `${PREFIX}${userId}`;
}

export function isOnboardingPending(userId: string | undefined): boolean {
  if (!userId || typeof window === 'undefined') return false;
  return localStorage.getItem(getOnboardingKey(userId)) !== 'dismissed';
}

export function dismissOnboarding(userId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getOnboardingKey(userId), 'dismissed');
}
