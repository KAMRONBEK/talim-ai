'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DesmosGraphPayload } from '@talim/types';

const DEFAULT_DESMOS_KEY = 'dcb31709b452b1d76136d478959e28edeec944a5';
const DESMOS_API_KEY = process.env.NEXT_PUBLIC_DESMOS_API_KEY || DEFAULT_DESMOS_KEY;
const DESMOS_SCRIPT = `https://www.desmos.com/api/v1.9/calculator.js?apiKey=${DESMOS_API_KEY}`;
const DESMOS_SCRIPT_ID = 'desmos-calculator-api';
const DESMOS_LOAD_TIMEOUT_MS = 12_000;
const FALLBACK_WIDTH = 640;
const FALLBACK_HEIGHT = 280;

interface DesmosCalculator {
  setExpression: (expr: {
    id: string;
    latex: string;
    color?: string;
    hidden?: boolean;
    sliderBounds?: { min: number; max: number; step: number };
  }) => void;
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

let desmosLoadPromise: Promise<void> | null = null;

interface FallbackPoint {
  x: number;
  y: number;
}

interface FallbackGraph {
  latex: string;
  points: FallbackPoint[];
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

function toFallbackExpression(latex: string): string | null {
  const rhs = latex.includes('=') ? latex.slice(latex.indexOf('=') + 1) : latex;
  const normalized = rhs
    .replace(/\\left|\\right/g, '')
    .replace(/\\cdot|\\times/g, '*')
    .replace(/\\pi/g, 'Math.PI')
    .replace(/\\sin/g, 'Math.sin')
    .replace(/\\cos/g, 'Math.cos')
    .replace(/\\tan/g, 'Math.tan')
    .replace(/\\sqrt/g, 'Math.sqrt')
    .replace(/\\ln/g, 'Math.log')
    .replace(/\\exp/g, 'Math.exp')
    .replace(/(^|[^.A-Za-z])sin\b/g, '$1Math.sin')
    .replace(/(^|[^.A-Za-z])cos\b/g, '$1Math.cos')
    .replace(/(^|[^.A-Za-z])tan\b/g, '$1Math.tan')
    .replace(/(^|[^.A-Za-z])sqrt\b/g, '$1Math.sqrt')
    .replace(/(^|[^.A-Za-z])ln\b/g, '$1Math.log')
    .replace(/(^|[^.A-Za-z])exp\b/g, '$1Math.exp')
    .replace(/\{|\}/g, '')
    .replace(/\bt\b/g, 'x')
    .replace(/\^/g, '**')
    .replace(/\s+/g, '');

  const allowedTokenRe = /^(?:[0-9.+\-*/(),x]|Math\.(?:PI|sin|cos|tan|sqrt|log|exp)|\*\*)+$/;
  if (!allowedTokenRe.test(normalized)) return null;
  return normalized;
}

function evaluateFallbackExpression(expression: string, x: number): number | null {
  try {
    const value = Function('x', `"use strict"; return (${expression});`)(x) as unknown;
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function buildFallbackGraph(payload: DesmosGraphPayload): FallbackGraph | null {
  const expression = payload.expressions.find((expr) => !expr.hidden);
  if (!expression) return null;

  const fallbackExpression = toFallbackExpression(expression.latex);
  if (!fallbackExpression) return null;

  const xmin = payload.viewport?.xmin ?? -10;
  const xmax = payload.viewport?.xmax ?? 10;
  const points: FallbackPoint[] = [];
  const samples = 160;

  for (let i = 0; i <= samples; i += 1) {
    const x = xmin + ((xmax - xmin) * i) / samples;
    const y = evaluateFallbackExpression(fallbackExpression, x);
    if (y !== null) points.push({ x, y });
  }

  if (points.length < 2) return null;

  const dataYMin = Math.min(...points.map((point) => point.y));
  const dataYMax = Math.max(...points.map((point) => point.y));
  const ySpread = Math.max(dataYMax - dataYMin, 1);
  const ymin = payload.viewport?.ymin ?? dataYMin - ySpread * 0.15;
  const ymax = payload.viewport?.ymax ?? dataYMax + ySpread * 0.15;
  if (xmax <= xmin || ymax <= ymin) return null;

  return { latex: expression.latex, points, xmin, xmax, ymin, ymax };
}

function fallbackPath(graph: FallbackGraph): string {
  return graph.points
    .map((point) => {
      const x = ((point.x - graph.xmin) / (graph.xmax - graph.xmin)) * FALLBACK_WIDTH;
      const y = FALLBACK_HEIGHT - ((point.y - graph.ymin) / (graph.ymax - graph.ymin)) * FALLBACK_HEIGHT;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function axisLine(value: number, min: number, max: number, size: number): number | null {
  if (value < min || value > max || max <= min) return null;
  return ((value - min) / (max - min)) * size;
}

function FallbackSvgGraph({ graph }: { graph: FallbackGraph }) {
  const xAxisY = axisLine(0, graph.ymin, graph.ymax, FALLBACK_HEIGHT);
  const yAxisX = axisLine(0, graph.xmin, graph.xmax, FALLBACK_WIDTH);

  return (
    <div className="my-2 overflow-hidden rounded-md border bg-card">
      <svg
        viewBox={`0 0 ${FALLBACK_WIDTH} ${FALLBACK_HEIGHT}`}
        role="img"
        aria-label={`Graph of ${graph.latex}`}
        className="h-[280px] w-full"
      >
        <rect width={FALLBACK_WIDTH} height={FALLBACK_HEIGHT} className="fill-background" />
        {xAxisY !== null && (
          <line
            x1="0"
            x2={FALLBACK_WIDTH}
            y1={FALLBACK_HEIGHT - xAxisY}
            y2={FALLBACK_HEIGHT - xAxisY}
            className="stroke-muted-foreground/40"
          />
        )}
        {yAxisX !== null && (
          <line
            x1={yAxisX}
            x2={yAxisX}
            y1="0"
            y2={FALLBACK_HEIGHT}
            className="stroke-muted-foreground/40"
          />
        )}
        <polyline
          points={fallbackPath(graph)}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-primary"
        />
      </svg>
      <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
        {graph.latex}
      </div>
    </div>
  );
}

function loadDesmosScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Desmos can only load in the browser'));
  }
  if (window.Desmos) {
    return Promise.resolve();
  }
  if (desmosLoadPromise) {
    return desmosLoadPromise;
  }

  desmosLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(DESMOS_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      if (error) {
        desmosLoadPromise = null;
        reject(error);
      } else {
        resolve();
      }
    };

    const timeoutId = window.setTimeout(() => {
      finish(new Error('Timed out loading Desmos'));
    }, DESMOS_LOAD_TIMEOUT_MS);

    script.addEventListener('load', () => finish(), { once: true });
    script.addEventListener('error', () => finish(new Error('Failed to load Desmos')), {
      once: true,
    });

    if (!existing) {
      script.id = DESMOS_SCRIPT_ID;
      script.src = DESMOS_SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return desmosLoadPromise;
}

export function DesmosGraph({ payload }: { payload: DesmosGraphPayload }) {
  const t = useTranslations('chat');
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<DesmosCalculator | null>(null);
  const payloadKey = JSON.stringify(payload);
  const fallbackGraph = buildFallbackGraph(payload);
  const [scriptReady, setScriptReady] = useState(
    typeof window !== 'undefined' && Boolean(window.Desmos),
  );
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void loadDesmosScript()
      .then(() => {
        if (!cancelled) {
          setScriptReady(true);
          setLoadError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!scriptReady || !containerRef.current || !window.Desmos) return;

    let observer: MutationObserver | null = null;
    let calc: DesmosCalculator | null = null;

    try {
      calculatorRef.current?.destroy();
      const isDark = document.documentElement.classList.contains('dark');
      calc = window.Desmos.GraphingCalculator(containerRef.current, {
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

      for (const slider of payload.sliders ?? []) {
        calc.setExpression({
          id: slider.id,
          latex: slider.latex,
          sliderBounds: {
            min: slider.min ?? -10,
            max: slider.max ?? 10,
            step: slider.step ?? 0.1,
          },
        });
      }

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
      setLoadError(false);

      const activeCalc = calc;
      observer = new MutationObserver(() => {
        activeCalc.updateSettings({
          invertedColors: document.documentElement.classList.contains('dark'),
        });
        activeCalc.resize();
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    } catch {
      calc?.destroy();
      calculatorRef.current?.destroy();
      calculatorRef.current = null;
      setLoadError(true);
    }

    return () => {
      observer?.disconnect();
      calculatorRef.current?.destroy();
      calculatorRef.current = null;
    };
  }, [scriptReady, payloadKey, payload]);

  if (loadError) {
    if (fallbackGraph) {
      return <FallbackSvgGraph graph={fallbackGraph} />;
    }

    return (
      <p className="my-2 rounded-md border bg-muted p-3 text-xs text-muted-foreground">
        {t('graphLoadError')}
      </p>
    );
  }

  return (
    <div className="relative isolate my-2 overflow-hidden">
      {!scriptReady && (
        <div className="flex h-[280px] items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
          {t('graphLoading')}
        </div>
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
