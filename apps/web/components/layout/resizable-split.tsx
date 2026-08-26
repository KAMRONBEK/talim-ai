'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@talim/ui';

interface ResizableSplitProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftPercent?: number;
  minLeft?: number;
  minRight?: number;
  className?: string;
  /** When set, left panel width (as % of container) is saved to localStorage after drag. */
  storageKey?: string;
}

/** Pixels the split moves per arrow press, and per arrow press with Shift held. */
const KEYBOARD_STEP = 24;
const KEYBOARD_STEP_COARSE = 96;

function readStoredPercent(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 && value < 100 ? value : null;
  } catch {
    return null;
  }
}

function writeStoredPercent(key: string, percent: number) {
  try {
    localStorage.setItem(key, String(percent));
  } catch {
    // ignore quota / private-mode errors
  }
}

function clampLeftWidth(width: number, containerWidth: number, minLeft: number, minRight: number) {
  const maxLeft = containerWidth - minRight - 6;
  if (maxLeft < minLeft) {
    return Math.max(0, Math.min(width, containerWidth - 6));
  }
  return Math.max(minLeft, Math.min(maxLeft, width));
}

export function ResizableSplit({
  left,
  right,
  defaultLeftPercent = 58,
  minLeft = 320,
  minRight = 280,
  className,
  storageKey,
}: ResizableSplitProps) {
  const t = useTranslations('common');
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Tracked in state, not read from the ref during render, so the aria-value* attributes
  // re-render when the container resizes.
  const [containerWidth, setContainerWidth] = useState(0);
  const leftPanelId = useId();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const apply = () => {
      const containerWidth = el.clientWidth;
      setContainerWidth(containerWidth);
      setLeftWidth((prev) => {
        if (prev === null) {
          const stored = storageKey ? readStoredPercent(storageKey) : null;
          const percent = stored ?? defaultLeftPercent;
          return clampLeftWidth(
            Math.round(containerWidth * (percent / 100)),
            containerWidth,
            minLeft,
            minRight,
          );
        }
        return clampLeftWidth(prev, containerWidth, minLeft, minRight);
      });
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [defaultLeftPercent, minLeft, minRight, storageKey]);

  const commitWidth = useCallback(
    (next: number) => {
      const container = containerRef.current;
      if (!container) return;
      const clamped = clampLeftWidth(next, container.clientWidth, minLeft, minRight);
      setLeftWidth(clamped);
      if (storageKey && container.clientWidth > 0) {
        writeStoredPercent(storageKey, (clamped / container.clientWidth) * 100);
      }
    },
    [minLeft, minRight, storageKey],
  );

  /**
   * The divider is the only control deciding how much screen the document gets, and it used to
   * be mouse-only: not reachable by Tab, and inert when focused programmatically. `role`
   * describes a STATIC separator unless the element is focusable — the resizable one is the
   * window-splitter pattern, which needs a tab stop, arrow keys, and aria-valuenow/min/max so
   * assistive tech can read the split as well as move it.
   */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container || leftWidth === null) return;
      const step = event.shiftKey ? KEYBOARD_STEP_COARSE : KEYBOARD_STEP;
      let next: number;
      switch (event.key) {
        case 'ArrowLeft':
          next = leftWidth - step;
          break;
        case 'ArrowRight':
          next = leftWidth + step;
          break;
        case 'Home':
          next = minLeft;
          break;
        case 'End':
          next = container.clientWidth - minRight - 6;
          break;
        default:
          return;
      }
      // Only once a key we handle is matched, so Tab and shortcuts still work from here.
      event.preventDefault();
      commitWidth(next);
    },
    [commitWidth, leftWidth, minLeft, minRight],
  );

  const startResize = useCallback(
    (pointerId: number, clientX: number, target: HTMLElement) => {
      const container = containerRef.current;
      if (!container || leftWidth === null) return;

      const startX = clientX;
      const startWidth = leftWidth;
      let latestWidth = startWidth;
      setIsDragging(true);

      try {
        target.setPointerCapture(pointerId);
      } catch {
        // ignore if capture fails
      }

      const onMove = (e: PointerEvent) => {
        const maxLeft = container.clientWidth - minRight - 6;
        const next = Math.max(
          minLeft,
          Math.min(maxLeft, startWidth + (e.clientX - startX)),
        );
        latestWidth = next;
        setLeftWidth(next);
      };

      const onUp = (e: PointerEvent) => {
        setIsDragging(false);
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerup', onUp);
        target.removeEventListener('pointercancel', onUp);
        try {
          target.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (storageKey && container.clientWidth > 0) {
          writeStoredPercent(storageKey, (latestWidth / container.clientWidth) * 100);
        }
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      target.addEventListener('pointermove', onMove);
      target.addEventListener('pointerup', onUp);
      target.addEventListener('pointercancel', onUp);
    },
    [leftWidth, minLeft, minRight, storageKey],
  );

  // Reported as a percentage of the container, which is what a screen reader can make sense of;
  // min/max mirror the pixel clamps so "End" and aria-valuemax agree.
  const usable = containerWidth > 0;
  const ariaMin = usable ? Math.round((minLeft / containerWidth) * 100) : 0;
  const ariaMax = usable ? Math.round(((containerWidth - minRight - 6) / containerWidth) * 100) : 100;
  const ariaNow =
    usable && leftWidth !== null ? Math.round((leftWidth / containerWidth) * 100) : undefined;

  return (
    <div
      ref={containerRef}
      className={cn('flex min-h-0 flex-1 overflow-hidden', isDragging && 'select-none', className)}
    >
      <div
        id={leftPanelId}
        className="flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden"
        style={leftWidth !== null ? { width: leftWidth } : { flex: defaultLeftPercent / (100 - defaultLeftPercent) }}
      >
        {left}
      </div>

      <div
        role="separator"
        tabIndex={0}
        aria-orientation="vertical"
        aria-label={t('resizePanels')}
        aria-controls={leftPanelId}
        aria-valuemin={ariaMin}
        aria-valuemax={ariaMax}
        aria-valuenow={ariaNow}
        onKeyDown={onKeyDown}
        className={cn(
          'group relative z-10 w-1.5 shrink-0 cursor-col-resize touch-none bg-border transition-colors hover:bg-primary/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          isDragging && 'bg-primary/50',
        )}
        onPointerDown={(e) => {
          e.preventDefault();
          startResize(e.pointerId, e.clientX, e.currentTarget);
        }}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{right}</div>
    </div>
  );
}
