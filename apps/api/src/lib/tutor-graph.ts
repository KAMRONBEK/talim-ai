import { GRAPH_FENCE_LANG, type DesmosGraphPayload } from '@talim/types';
import type OpenAI from 'openai';
import { z } from 'zod';

const LATEX_DENY_RE = /<|>|javascript|eval|`/i;
const MAX_EXPRESSIONS = 8;
const MAX_LATEX_LEN = 200;
const VIEWPORT_LIMIT = 100;

const expressionSchema = z.object({
  id: z.string().min(1).max(32),
  latex: z.string().min(1).max(MAX_LATEX_LEN),
  color: z.string().max(16).optional(),
  hidden: z.boolean().optional(),
});

const viewportSchema = z
  .object({
    xmin: z.number().min(-VIEWPORT_LIMIT).max(VIEWPORT_LIMIT),
    xmax: z.number().min(-VIEWPORT_LIMIT).max(VIEWPORT_LIMIT),
    ymin: z.number().min(-VIEWPORT_LIMIT).max(VIEWPORT_LIMIT),
    ymax: z.number().min(-VIEWPORT_LIMIT).max(VIEWPORT_LIMIT),
  })
  .refine((v) => v.xmax > v.xmin && v.ymax > v.ymin, {
    message: 'Invalid viewport bounds',
  });

const graphPayloadSchema = z.object({
  expressions: z.array(expressionSchema).min(1).max(MAX_EXPRESSIONS),
  viewport: viewportSchema.optional(),
});

function sanitizeLatex(latex: string): string {
  const trimmed = latex.trim();
  if (LATEX_DENY_RE.test(trimmed)) {
    throw new Error('Invalid latex expression');
  }
  return trimmed;
}

export function serializeGraphBlock(payload: DesmosGraphPayload): string {
  return `\n\n\`\`\`${GRAPH_FENCE_LANG}\n${JSON.stringify(payload)}\n\`\`\`\n\n`;
}

export function validateGraphPayload(raw: unknown): DesmosGraphPayload {
  const parsed = graphPayloadSchema.parse(raw);
  return {
    expressions: parsed.expressions.map((expr) => ({
      ...expr,
      latex: sanitizeLatex(expr.latex),
    })),
    viewport: parsed.viewport,
  };
}

export const RENDER_GRAPH_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'render_graph',
    description:
      'Render an interactive Desmos graph when explaining functions, curves, intersections, or transformations. Use Desmos-compatible LaTeX (e.g. y=x^2, y=\\sin(x)).',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        expressions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Unique expression id, e.g. f1' },
              latex: { type: 'string', description: 'Desmos LaTeX, e.g. y=x^2' },
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
      },
      required: ['expressions', 'viewport'],
      additionalProperties: false,
    },
  },
};
