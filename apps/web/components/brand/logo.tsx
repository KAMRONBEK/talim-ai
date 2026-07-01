'use client';

import { useId } from 'react';
import { cn } from '@talim/ui';

/**
 * Talim AI logo mark ("Scholar" system) — the open-book × constellation hybrid
 * (Logo v3). Two-tone pages ground it in study while linked nodes branch upward
 * from a single source, the way Talim turns one document into many connected
 * ideas; the top clay node is the spark of understanding. Default renders the
 * cream mark on a pine squircle tile; `mono` renders just the glyph in
 * `currentColor` (no tile) for use inside a coloured container.
 */
export function LogoMark({ className, mono = false }: { className?: string; mono?: boolean }) {
  const id = useId();
  const ink = mono ? 'currentColor' : '#F7F2E8'; // cream — left page, edges, base nodes
  const leaf = mono ? 'currentColor' : '#9DC4B8'; // sage — right page
  const spark = mono ? 'currentColor' : '#D9663D'; // clay — the spark node
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
      {/* open-book × constellation, centred within the tile's clearspace */}
      <g transform="translate(9.6 9.6) scale(0.6)">
        {/* two-tone open book — the source */}
        <path d="M24 27C19.5 24 14 24 9 25.5V41C14 39.5 19.5 39.5 24 42Z" fill={ink} />
        <path d="M24 27C28.5 24 34 24 39 25.5V41C34 39.5 28.5 39.5 24 42Z" fill={leaf} />
        {/* edges rising from the spine into the constellation */}
        <g stroke={ink} strokeWidth="2.2">
          <line x1="24" y1="27" x2="16" y2="15" />
          <line x1="24" y1="27" x2="33" y2="17" />
          <line x1="16" y1="15" x2="25" y2="8" />
        </g>
        {/* nodes — two cream, the spark in clay */}
        <circle cx="16" cy="15" r="3.4" fill={ink} />
        <circle cx="33" cy="17" r="3.4" fill={ink} />
        <circle cx="25" cy="8" r="4" fill={spark} />
      </g>
    </svg>
  );
}
