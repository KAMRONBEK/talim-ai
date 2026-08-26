'use client';

import { RefreshCw } from 'lucide-react';

interface LoadFailedProps {
  /** What failed to load, as a noun phrase: "this user", "organizations", "the audit log". */
  what: string;
  /** The query's refetch. Omitted only where the caller genuinely has nothing to retry. */
  onRetry?: () => void;
  isRetrying?: boolean;
  /** Layout adjustment for the caller's context — e.g. `justify-center` inside a table cell. */
  className?: string;
}

/**
 * The failure state for an admin read.
 *
 * Every one of these used to say "Please try again" and then offer no way to try again — the
 * only recourse was reloading the page, which on a detail route also means finding your way
 * back to the record you were looking at. Telling an operator to retry while withholding the
 * button is worse than saying nothing, so the button comes with the sentence.
 */
export function LoadFailed({ what, onRetry, isRetrying, className }: LoadFailedProps) {
  return (
    <div
      role="alert"
      className={`flex flex-wrap items-center gap-3 text-sm text-destructive${className ? ` ${className}` : ''}`}
    >
      <span>Couldn&apos;t load {what}.</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-3.5 w-3.5${isRetrying ? ' animate-spin' : ''}`}
            aria-hidden="true"
          />
          {isRetrying ? 'Retrying…' : 'Try again'}
        </button>
      )}
    </div>
  );
}
