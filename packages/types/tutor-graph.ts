export interface DesmosExpression {
  id: string;
  latex: string;
  color?: string;
  hidden?: boolean;
}

export interface DesmosSlider {
  id: string;
  latex: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface DesmosViewport {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export interface DesmosGraphPayload {
  expressions: DesmosExpression[];
  viewport?: DesmosViewport;
  sliders?: DesmosSlider[];
}

export const GRAPH_FENCE_LANG = 'graph';

export function serializeGraphBlock(payload: DesmosGraphPayload): string {
  return `\n\n\`\`\`${GRAPH_FENCE_LANG}\n${JSON.stringify(payload)}\n\`\`\`\n\n`;
}

export function parseGraphBlock(json: string): DesmosGraphPayload | null {
  try {
    const parsed = JSON.parse(json.trim()) as DesmosGraphPayload;
    if (!Array.isArray(parsed.expressions) || parsed.expressions.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
