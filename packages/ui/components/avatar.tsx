import * as React from 'react';
import { cn } from '../lib/utils';

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary to-[hsl(var(--accent-secondary))] text-sm font-semibold text-primary-foreground',
        className,
      )}
      {...props}
    />
  ),
);
Avatar.displayName = 'Avatar';

function AvatarFallback({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('flex h-full w-full items-center justify-center', className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { Avatar, AvatarFallback };
