'use client';

import type { LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export type StatCardTone = 'pine' | 'clay' | 'success' | 'warning';

const toneClasses: Record<StatCardTone, string> = {
  pine: 'bg-primary/10 text-primary',
  clay: 'bg-accent-secondary/15 text-accent-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
};

/**
 * Shared dashboard stat tile (used by both the tutor and student dashboards).
 * Renders as a link when `href` is given; `hint` is an optional one-line
 * sub-label under the value for extra context (e.g. "3 ready", "of 12 assigned").
 */
export function StatCard({
  href,
  label,
  value,
  icon: Icon,
  tone = 'pine',
  hint,
  valueClassName,
}: {
  href?: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: StatCardTone;
  hint?: string;
  valueClassName?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p
        className={`mt-4 font-display text-4xl font-semibold tabular-nums${
          valueClassName ? ` ${valueClassName}` : ''
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
    </>
  );

  const className = 'group rounded-2xl border border-border/70 bg-card p-5 shadow-soft';
  if (href) {
    return (
      <Link href={href} className={`${className} hover-lift`}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}
