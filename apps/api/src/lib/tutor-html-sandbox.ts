import type { HtmlSandboxPayload } from '@talim/types';
import type OpenAI from 'openai';
import { z } from 'zod';

const MAX_HTML_LEN = 8000;
const DENY_RE = /<script[^>]*src|javascript:|on\w+\s*=|fetch\(|XMLHttpRequest|import\s/i;

const htmlSandboxSchema = z.object({
  template: z.enum(['pendulum', 'projectile', 'number-line', 'custom']),
  params: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
  html: z.string().max(MAX_HTML_LEN).optional(),
});

export function validateHtmlSandboxPayload(raw: unknown): HtmlSandboxPayload {
  const parsed = htmlSandboxSchema.parse(raw);
  if (parsed.template === 'custom') {
    if (!parsed.html?.trim()) {
      throw new Error('Custom template requires html');
    }
    if (DENY_RE.test(parsed.html)) {
      throw new Error('Invalid custom HTML');
    }
  }
  return parsed;
}

export const RENDER_HTML_SANDBOX_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'render_html_sim',
    description:
      'Render a simple physics or math simulation using a pre-approved template: pendulum, projectile, number-line, or custom (inline HTML/CSS only, no external scripts).',
    parameters: {
      type: 'object',
      properties: {
        template: { type: 'string', enum: ['pendulum', 'projectile', 'number-line', 'custom'] },
        params: {
          type: 'object',
          additionalProperties: {
            oneOf: [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }],
          },
          description: 'Template parameters, e.g. { "gravity": 9.8, "angle": 45 }',
        },
        html: {
          type: 'string',
          description: 'Only for template=custom: safe inline HTML/CSS simulation markup',
        },
      },
      required: ['template'],
      additionalProperties: false,
    },
  },
};
