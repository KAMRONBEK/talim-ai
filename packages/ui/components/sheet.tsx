'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';

interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

function Sheet({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return <SheetContext.Provider value={{ open, setOpen }}>{children}</SheetContext.Provider>;
}

function SheetTrigger({ children }: { children: React.ReactElement }) {
  const ctx = React.useContext(SheetContext);
  const child = React.Children.only(children) as React.ReactElement<{
    onClick?: (e: React.MouseEvent) => void;
  }>;
  if (!ctx) return child;

  return React.cloneElement(child, {
    onClick: (e: React.MouseEvent) => {
      child.props.onClick?.(e);
      ctx.setOpen(true);
    },
  });
}

function SheetContent({ className, children, side = 'right', ...props }: React.HTMLAttributes<HTMLDivElement> & { side?: 'right' | 'left' }) {
  const ctx = React.useContext(SheetContext);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!ctx?.open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 z-0 bg-black/40"
        aria-hidden="true"
        onClick={() => ctx.setOpen(false)}
      />
      <div
        className={cn(
          'fixed top-0 z-10 flex h-full w-full max-w-md flex-col border bg-card shadow-lg',
          side === 'right' ? 'right-0' : 'left-0',
          className,
        )}
        onMouseDown={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b p-6', className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold', className)} {...props} />;
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle };
