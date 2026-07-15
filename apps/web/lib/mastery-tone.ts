/** Design tokens for a mastery value: pine when strong, clay when middling, red when at-risk. */
export function masteryTone(value: number | null): { bar: string; text: string } {
  if (value == null) return { bar: 'bg-muted-foreground/40', text: 'text-muted-foreground' };
  if (value >= 70) return { bar: 'bg-primary', text: 'text-primary' };
  if (value >= 50) return { bar: 'bg-accent-secondary', text: 'text-accent-secondary' };
  return { bar: 'bg-destructive', text: 'text-destructive' };
}

export function isRecentlyActive(lastActivityAt: string | null): boolean {
  if (!lastActivityAt) return false;
  const days = (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7;
}
