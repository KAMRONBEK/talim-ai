import { type DesmosGraphPayload, GRAPH_FENCE_LANG } from '@talim/types';
import type OpenAI from 'openai';
import { z } from 'zod';

const LATEX_DENY_RE = /<|>|javascript|eval|`/i;
const MAX_EXPRESSIONS = 8;
const MAX_SLIDERS = 4;
const MAX_LATEX_LEN = 200;
const VIEWPORT_LIMIT = 100;
const finiteNumber = z.number().finite();

const expressionSchema = z.object({
  id: z.string().min(1).max(32),
  latex: z.string().min(1).max(MAX_LATEX_LEN),
  color: z.string().max(16).optional(),
  hidden: z.boolean().optional(),
});

const sliderSchema = z.object({
  id: z.string().min(1).max(32),
  latex: z.string().min(1).max(MAX_LATEX_LEN),
  min: finiteNumber.min(-VIEWPORT_LIMIT).max(VIEWPORT_LIMIT).optional(),
  max: finiteNumber.min(-VIEWPORT_LIMIT).max(VIEWPORT_LIMIT).optional(),
  step: finiteNumber.positive().max(100).optional(),
}).refine((s) => s.min === undefined || s.max === undefined || s.max > s.min, {
  message: 'Invalid slider bounds',
});

const viewportSchema = z
  .object({
    xmin: finiteNumber.min(-VIEWPORT_LIMIT).max(VIEWPORT_LIMIT),
    xmax: finiteNumber.min(-VIEWPORT_LIMIT).max(VIEWPORT_LIMIT),
    ymin: finiteNumber.min(-VIEWPORT_LIMIT).max(VIEWPORT_LIMIT),
    ymax: finiteNumber.min(-VIEWPORT_LIMIT).max(VIEWPORT_LIMIT),
  })
  .refine((v) => v.xmax > v.xmin && v.ymax > v.ymin, {
    message: 'Invalid viewport bounds',
  });

const graphPayloadSchema = z.object({
  expressions: z.array(expressionSchema).min(1).max(MAX_EXPRESSIONS),
  viewport: viewportSchema.optional(),
  sliders: z.array(sliderSchema).max(MAX_SLIDERS).optional(),
});

function sanitizeLatex(latex: string): string {
  const trimmed = latex.trim();
  if (LATEX_DENY_RE.test(trimmed)) {
    throw new Error('Invalid latex expression');
  }
  return trimmed;
}

function assertUniqueIds(ids: string[]): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new Error('Duplicate graph id');
    }
    seen.add(id);
  }
}

/** @deprecated Use serializeVisualBlock from tutor-tools */
export function serializeGraphBlock(payload: DesmosGraphPayload): string {
  return `\n\n\`\`\`${GRAPH_FENCE_LANG}\n${JSON.stringify(payload)}\n\`\`\`\n\n`;
}

export function validateGraphPayload(raw: unknown): DesmosGraphPayload {
  const parsed = graphPayloadSchema.parse(raw);
  assertUniqueIds([
    ...parsed.expressions.map((expr) => expr.id),
    ...(parsed.sliders ?? []).map((slider) => slider.id),
  ]);

  return {
    expressions: parsed.expressions.map((expr) => ({
      ...expr,
      latex: sanitizeLatex(expr.latex),
    })),
    viewport: parsed.viewport,
    sliders: parsed.sliders?.map((s) => ({
      ...s,
      latex: sanitizeLatex(s.latex),
    })),
  };
}

export const RENDER_GRAPH_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'render_graph',
    description:
      'Render an interactive Desmos graph for functions, curves, intersections, or transformations. Use Desmos LaTeX (e.g. y=x^2, y=\\sin(x)). Add sliders for parameters like a, b, k when exploring how values change the graph.',
    parameters: {
      type: 'object',
      properties: {
        expressions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Unique expression id, e.g. f1' },
              latex: { type: 'string', description: 'Desmos LaTeX, e.g. y=x^2 or y=a*x^2+b' },
            },
            required: ['id', 'latex'],
            additionalProperties: false,
          },
        },
        viewport: {
          type: 'object',
          properties: {
            xmin: { type: 'number' },
            xmax: { type: 'number' },
            ymin: { type: 'number' },
            ymax: { type: 'number' },
          },
          required: ['xmin', 'xmax', 'ymin', 'ymax'],
          additionalProperties: false,
        },
        sliders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              latex: { type: 'string', description: 'Slider definition, e.g. a=1' },
              min: { type: 'number' },
              max: { type: 'number' },
              step: { type: 'number' },
            },
            required: ['id', 'latex'],
            additionalProperties: false,
          },
        },
      },
      required: ['expressions', 'viewport'],
      additionalProperties: false,
    },
  },
};
