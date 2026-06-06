import type { DesmosGraphPayload } from './tutor-graph';
import { GRAPH_FENCE_LANG, parseGraphBlock } from './tutor-graph';

export type VisualKind =
  | 'desmos'
  | 'mermaid'
  | 'chart'
  | 'geogebra'
  | 'manim'
  | 'html-sandbox';

export interface MermaidPayload {
  diagram: string;
  title?: string;
}

export interface ChartSeries {
  name: string;
  data: number[];
}

export interface ChartPayload {
  type: 'bar' | 'line' | 'area';
  title?: string;
  labels: string[];
  series: ChartSeries[];
  xLabel?: string;
  yLabel?: string;
}

export interface GeoGebraPayload {
  appName: 'graphing' | 'geometry' | '3d';
  width?: number;
  height?: number;
  commands: string[];
  showToolBar?: boolean;
}

export interface ManimPayload {
  jobId?: string;
  status: 'pending' | 'ready' | 'failed';
  script?: string;
  url?: string;
  error?: string;
}

export interface HtmlSandboxPayload {
  template: 'pendulum' | 'projectile' | 'number-line' | 'custom';
  params?: Record<string, number | string | boolean>;
  html?: string;
}

export type VisualPayloadMap = {
  desmos: DesmosGraphPayload;
  mermaid: MermaidPayload;
  chart: ChartPayload;
  geogebra: GeoGebraPayload;
  manim: ManimPayload;
  'html-sandbox': HtmlSandboxPayload;
};

export type VisualBlock =
  | { kind: 'desmos'; payload: DesmosGraphPayload }
  | { kind: 'mermaid'; payload: MermaidPayload }
  | { kind: 'chart'; payload: ChartPayload }
  | { kind: 'geogebra'; payload: GeoGebraPayload }
  | { kind: 'manim'; payload: ManimPayload }
  | { kind: 'html-sandbox'; payload: HtmlSandboxPayload };

export const VISUAL_FENCE_LANG = 'visual';

export function serializeVisualBlock(block: VisualBlock): string {
  return `\n\n\`\`\`${VISUAL_FENCE_LANG}\n${JSON.stringify(block)}\n\`\`\`\n\n`;
}

export function parseVisualBlock(json: string): VisualBlock | null {
  try {
    const parsed = JSON.parse(json.trim()) as VisualBlock;
    if (!parsed?.kind || !parsed?.payload) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Parse legacy ```graph fences or new ```visual fences from raw fence body + lang tag. */
export function parseFenceBlock(lang: string | undefined, raw: string): VisualBlock | null {
  if (lang === VISUAL_FENCE_LANG) {
    return parseVisualBlock(raw);
  }
  if (lang === GRAPH_FENCE_LANG) {
    const graph = parseGraphBlock(raw);
    if (!graph) return null;
    return { kind: 'desmos', payload: graph };
  }
  return null;
}

/** @deprecated Use serializeVisualBlock */
export function serializeDesmosAsVisual(payload: DesmosGraphPayload): string {
  return serializeVisualBlock({ kind: 'desmos', payload });
}
