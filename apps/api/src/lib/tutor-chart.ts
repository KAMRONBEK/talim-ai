import type { ChartPayload } from '@talim/types';
import type OpenAI from 'openai';
import { z } from 'zod';

const MAX_LABELS = 20;
const MAX_SERIES = 4;

const chartSchema = z.object({
  type: z.enum(['bar', 'line', 'area']),
  title: z.string().max(120).optional(),
  labels: z.array(z.string().max(64)).min(1).max(MAX_LABELS),
  series: z
    .array(
      z.object({
        name: z.string().min(1).max(64),
        data: z.array(z.number().finite()).min(1).max(MAX_LABELS),
      }),
    )
    .min(1)
    .max(MAX_SERIES),
  xLabel: z.string().max(64).optional(),
  yLabel: z.string().max(64).optional(),
});

export function validateChartPayload(raw: unknown): ChartPayload {
  const parsed = chartSchema.parse(raw);
  const labelCount = parsed.labels.length;
  for (const s of parsed.series) {
    if (s.data.length !== labelCount) {
      throw new Error('Series data length must match labels length');
    }
  }
  return parsed;
}

export const RENDER_CHART_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'render_chart',
    description:
      'Render a bar, line, or area chart when comparing numeric data or showing trends. Provide real numbers only.',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['bar', 'line', 'area'] },
        title: { type: 'string' },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'X-axis category labels',
        },
        series: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              data: { type: 'array', items: { type: 'number' } },
            },
            required: ['name', 'data'],
            additionalProperties: false,
          },
        },
        xLabel: { type: 'string' },
        yLabel: { type: 'string' },
      },
      required: ['type', 'labels', 'series'],
      additionalProperties: false,
    },
  },
};
