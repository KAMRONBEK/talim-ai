'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { cn } from '@talim/ui';
import { useChatStore } from '@/store/useChatStore';

/** Keep the seeded prompt to a sane size — a long paragraph selection is enough context. */
const MAX_SNIPPET = 600;

interface TipState {
  /** Container-relative anchor (px) the tooltip is pinned to. */
  top: number;
  left: number;
  text: string;
  /** True when there's no room above the selection, so render below it instead. */
  flip: boolean;
}

/**
 * Wraps readable content and offers an "Ask AI" affordance on text selection.
 *
 * When the user selects text inside `children`, a small floating tooltip appears
 * near the selection. Choosing an action seeds the tutor composer via the chat
 * store (`seedPrompt`) — ChatWindow prefills + focuses it. This is intentionally
 * a one-way channel: the reader and the tutor live in different subtrees (the
 * chat only mounts on the Chat tab), so we don't switch tabs or auto-send from
 * here; the seed is consumed whenever the Chat tab is (or becomes) open.
 */
export function SelectionAsk({
  children,
  enabled = true,
  className,
  style,
}: {
  children: ReactNode;
  enabled?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const t = useTranslations('chat');
  const containerRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const compute = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setTip(null);
        return;
      }
      const text = sel.toString().replace(/\s+/g, ' ').trim();
      if (text.length < 2) {
        setTip(null);
        return;
      }
      const { anchorNode, focusNode } = sel;
      if (
        !anchorNode ||
        !focusNode ||
        !container.contains(anchorNode) ||
        !container.contains(focusNode)
      ) {
        // Selection started or ended outside this reader — not ours.
        setTip(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setTip(null);
        return;
      }
      const cRect = container.getBoundingClientRect();
      const relTop = rect.top - cRect.top;
      const flip = relTop < 44; // not enough headroom above → drop below the selection
      setTip({
        top: (flip ? rect.bottom : rect.top) - cRect.top + container.scrollTop,
        left: Math.min(
          Math.max(rect.left - cRect.left + rect.width / 2, 8),
          Math.max(container.clientWidth - 8, 8),
        ),
        text: text.slice(0, MAX_SNIPPET),
        flip,
      });
    };

    // A pointer release finalizes the selection; defer a tick so the browser
    // has committed it before we measure.
    const onPointerUp = () => window.setTimeout(compute, 0);
    // A plain click collapses the selection → dismiss.
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) setTip(null);
    };

    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchend', onPointerUp);
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchend', onPointerUp);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [enabled]);

  const dispatch = useCallback((prompt: string) => {
    useChatStore.getState().seedPrompt(prompt);
    window.getSelection()?.removeAllRanges();
    setTip(null);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)} style={style}>
      {children}
      {enabled && tip && (
        <div
          role="group"
          aria-label={t('suggestionsLabel')}
          className={cn(
            'absolute z-30 -translate-x-1/2',
            tip.flip ? 'translate-y-0 pt-1.5' : '-translate-y-full pb-1.5',
          )}
          style={{ top: tip.top, left: tip.left }}
          // Keep the browser selection alive through the click so the snippet survives.
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center overflow-hidden rounded-lg border border-border bg-card shadow-soft">
            <button
              type="button"
              onClick={() => dispatch(t('selectionAskPrompt', { snippet: tip.text }))}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {t('askSelection')}
            </button>
            <span className="h-4 w-px bg-border" aria-hidden="true" />
            <button
              type="button"
              onClick={() => dispatch(t('excerptPrompt', { snippet: tip.text }))}
              className="px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {t('explainSelection')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
