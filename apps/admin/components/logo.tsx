'use client';

import { useId } from 'react';
import { cn } from '@talim/ui';

/**
 * Talim AI logo mark ("Scholar" system): a pine squircle holding a cream slab "T"
 * with a clay spark. `mono` renders just the glyph in `currentColor` (no tile).
 */
export function LogoMark({ className, mono = false }: { className?: string; mono?: boolean }) {
  const id = useId();
  const glyph = mono ? 'currentColor' : '#F7F2E8';
  const spark = mono ? 'currentColor' : '#D9663D';
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('h-8 w-8', className)}
      fill="none"
      role="img"
      aria-label="Talim AI"
      xmlns="http://www.w3.org/2000/svg"
    >
      {!mono && (
        <>
          <defs>
            <linearGradient id={id} x1="6" y1="4" x2="42" y2="46" gradientUnits="userSpaceOnUse">
              <stop stopColor="#23695B" />
              <stop offset="1" stopColor="#184B41" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="44" height="44" rx="14" fill={`url(#${id})`} />
        </>
      )}
      <rect x="12" y="15.5" width="24" height="6" rx="3" fill={glyph} />
      <rect x="21" y="15.5" width="6" height="20.5" rx="3" fill={glyph} />
      <path
        d="M37.5 8.5c0 1.85 1.15 3 3 3-1.85 0-3 1.15-3 3 0-1.85-1.15-3-3-3 1.85 0 3-1.15 3-3Z"
        fill={spark}
      />
    </svg>
  );
}
