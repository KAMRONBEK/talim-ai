'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@talim/ui';

interface ResizableSplitProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftPercent?: number;
  minLeft?: number;
  minRight?: number;
  className?: string;
}

export function ResizableSplit({
  left,
  right,
  defaultLeftPercent = 58,
  minLeft = 320,
  minRight = 280,
  className,
}: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const apply = () => {
      setLeftWidth((prev) => {
        if (prev !== null) return prev;
        return Math.round(el.clientWidth * (defaultLeftPercent / 100));
      });
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [defaultLeftPercent]);

  const startResize = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container || leftWidth === null) return;

      const startX = clientX;
      const startWidth = leftWidth;
      setIsDragging(true);

      const onMove = (e: MouseEvent) => {
        const maxLeft = container.clientWidth - minRight - 6;
        const next = Math.max(minLeft, Math.min(maxLeft, startWidth + (e.clientX - startX)));
        setLeftWidth(next);
      };

      const onUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [leftWidth, minLeft, minRight],
  );

  return (
    <div
      ref={containerRef}
      className={cn('flex min-h-0 flex-1 overflow-hidden', isDragging && 'select-none', className)}
    >
      <div
        className="flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden"
        style={leftWidth !== null ? { width: leftWidth } : { flex: defaultLeftPercent / (100 - defaultLeftPercent) }}
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        className={cn(
          'group relative z-10 w-1.5 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/40',
          isDragging && 'bg-primary/50',
        )}
        onMouseDown={(e) => {
          e.preventDefault();
          startResize(e.clientX);
        }}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{right}</div>
    </div>
  );
}
