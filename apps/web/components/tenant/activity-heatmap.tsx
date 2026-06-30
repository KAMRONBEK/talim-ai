'use client';

import { cn } from '@/lib/utils';

export function ActivityHeatmap({ days }: { days: string[] }) {
  const active = new Set(days);
  const today = new Date();
  const cells = Array.from({ length: 35 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (34 - i));
    const key = date.toISOString().slice(0, 10);
    return { key, active: active.has(key), label: date.toLocaleDateString() };
  });

  return (
    <div className="grid grid-cols-7 gap-1">
      {cells.map((cell) => (
        <div
          key={cell.key}
          title={cell.label}
          className={cn(
            'aspect-square rounded-md transition-colors',
            cell.active ? 'bg-primary' : 'bg-muted',
          )}
        />
      ))}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
    </div>
  );
}
