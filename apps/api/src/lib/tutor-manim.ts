import type { ManimPayload } from '@talim/types';
import type OpenAI from 'openai';
import { z } from 'zod';

const MAX_SCRIPT_LEN = 4000;
const DENY_RE = /import\s+os|subprocess|open\(|exec\(|eval\(|__import__/i;

const manimSchema = z.object({
  script: z.string().min(1).max(MAX_SCRIPT_LEN),
});

export function validateManimScript(raw: unknown): string {
  const parsed = manimSchema.parse(raw);
  const script = parsed.script.trim();
  if (DENY_RE.test(script)) {
    throw new Error('Invalid Manim script');
  }
  return script;
}

export function buildPendingManimPayload(jobId: string, script: string): ManimPayload {
  return { jobId, status: 'pending', script };
}

export const RENDER_MANIM_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'render_manim',
    description:
      'Request an animated math/physics explanation rendered with Manim. Provide a short Manim Community scene script (Python). The animation renders asynchronously.',
    parameters: {
      type: 'object',
      properties: {
        script: {
          type: 'string',
          description: 'Manim Community scene code, e.g. class MyScene(Scene): def construct(self): ...',
        },
      },
      required: ['script'],
      additionalProperties: false,
    },
  },
};
