'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useTranslations } from 'next-intl';
import type { DesmosGraphPayload } from '@talim/types';

const DESMOS_API_KEY = 'dcb31709b452b1d76136d478959e28edeec944a5';
const DESMOS_SCRIPT = `https://www.desmos.com/api/v1.9/calculator.js?apiKey=${DESMOS_API_KEY}`;

interface DesmosCalculator {
  setExpression: (expr: { id: string; latex: string; color?: string; hidden?: boolean }) => void;
  setMathBounds: (bounds: { left: number; right: number; bottom: number; top: number }) => void;
  updateSettings: (settings: Record<string, unknown>) => void;
  resize: () => void;
  destroy: () => void;
}

declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (
        el: HTMLElement,
        options?: Record<string, unknown>,
      ) => DesmosCalculator;
    };
  }
}

export function DesmosGraph({ payload }: { payload: DesmosGraphPayload }) {
  const t = useTranslations('chat');
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<DesmosCalculator | null>(null);
  const [scriptReady, setScriptReady] = useState(
    typeof window !== 'undefined' && Boolean(window.Desmos),
  );

  useEffect(() => {
    if (!scriptReady || !containerRef.current || !window.Desmos) return;

    calculatorRef.current?.destroy();
    const isDark = document.documentElement.classList.contains('dark');
    const calc = window.Desmos.GraphingCalculator(containerRef.current, {
      expressions: false,
      settingsMenu: false,
      zoomButtons: true,
      lockViewport: false,
      border: false,
      keypad: false,
      graphpaper: true,
      autosize: true,
    });

    calc.updateSettings({
      invertedColors: isDark,
      showGrid: true,
    });

    for (const expr of payload.expressions) {
      calc.setExpression({
        id: expr.id,
        latex: expr.latex,
        color: expr.color,
        hidden: expr.hidden,
      });
    }

    if (payload.viewport) {
      calc.setMathBounds({
        left: payload.viewport.xmin,
        right: payload.viewport.xmax,
        bottom: payload.viewport.ymin,
        top: payload.viewport.ymax,
      });
    }

    calc.resize();
    calculatorRef.current = calc;

    return () => {
      calculatorRef.current?.destroy();
      calculatorRef.current = null;
    };
  }, [scriptReady, payload]);

  return (
    <div className="relative isolate my-2 overflow-hidden">
      {!scriptReady && (
        <Script
          src={DESMOS_SCRIPT}
          strategy="lazyOnload"
          onLoad={() => setScriptReady(true)}
          onError={() => setScriptReady(false)}
        />
      )}
      <div
        ref={containerRef}
        className="relative z-0 h-[280px] w-full overflow-hidden rounded-md border bg-card"
        aria-label={t('graphLabel')}
      />
      <p className="mt-1 text-[10px] text-muted-foreground">
        {t('desmosAttribution')}{' '}
        <a
          href="https://www.desmos.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Desmos
        </a>
      </p>
    </div>
  );
}
