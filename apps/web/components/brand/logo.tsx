'use client';

import { useId } from 'react';
import { cn } from '@talim/ui';

/**
 * Talim AI logo mark: a violet→marigold "squircle" with a clean white T and a
 * 4-point spark (the brand's "spark of learning"). `mono` renders just the white
 * glyph (no gradient tile) for use inside a coloured container.
 */
export function LogoMark({ className, mono = false }: { className?: string; mono?: boolean }) {
  const id = useId();
  const fg = mono ? 'currentColor' : '#ffffff';
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
            <linearGradient id={id} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6D5CF0" />
              <stop offset="1" stopColor="#F9A826" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="44" height="44" rx="13" fill={`url(#${id})`} />
        </>
      )}
      {/* T — crossbar + stem with rounded terminals */}
      <rect x="12" y="15" width="24" height="6.5" rx="3.25" fill={fg} />
      <rect x="20.75" y="15" width="6.5" height="21" rx="3.25" fill={fg} />
      {/* 4-point spark at the upper-right */}
      <path
        d="M37 8c0 1.93 1.07 3 3 3-1.93 0-3 1.07-3 3 0-1.93-1.07-3-3-3 1.93 0 3-1.07 3-3Z"
        fill={fg}
      />
    </svg>
  );
}
