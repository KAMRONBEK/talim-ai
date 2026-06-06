import type { MermaidPayload } from '@talim/types';
import type OpenAI from 'openai';
import { z } from 'zod';

const MAX_DIAGRAM_LEN = 4000;
const DENY_RE = /<script|javascript:|on\w+=/i;

const mermaidSchema = z.object({
  diagram: z.string().min(1).max(MAX_DIAGRAM_LEN),
  title: z.string().max(120).optional(),
});

export function validateMermaidPayload(raw: unknown): MermaidPayload {
  const parsed = mermaidSchema.parse(raw);
  const diagram = parsed.diagram.trim();
  if (DENY_RE.test(diagram)) {
    throw new Error('Invalid mermaid diagram');
  }
  return { diagram, title: parsed.title };
}

export const RENDER_MERMAID_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'render_mermaid',
    description:
      'Render a Mermaid diagram for processes, timelines, cause-effect flows, hierarchies, or concept maps. Use valid Mermaid syntax (flowchart, sequenceDiagram, classDiagram, etc.).',
    parameters: {
      type: 'object',
      properties: {
        diagram: {
          type: 'string',
          description: 'Valid Mermaid diagram source, e.g. flowchart TD\\n  A-->B',
        },
        title: { type: 'string', description: 'Optional short title for the diagram' },
      },
      required: ['diagram'],
      additionalProperties: false,
    },
  },
};
