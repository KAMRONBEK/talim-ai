import type { GeoGebraPayload } from '@talim/types';
import type OpenAI from 'openai';
import { z } from 'zod';

const MAX_COMMANDS = 20;
const MAX_CMD_LEN = 200;
const DENY_RE = /<script|javascript:|eval\(|fetch\(|import\s/i;

const geogebraSchema = z.object({
  appName: z.enum(['graphing', 'geometry', '3d']),
  width: z.number().min(200).max(800).optional(),
  height: z.number().min(200).max(600).optional(),
  commands: z.array(z.string().min(1).max(MAX_CMD_LEN)).min(1).max(MAX_COMMANDS),
  showToolBar: z.boolean().optional(),
});

export function validateGeoGebraPayload(raw: unknown): GeoGebraPayload {
  const parsed = geogebraSchema.parse(raw);
  for (const cmd of parsed.commands) {
    if (DENY_RE.test(cmd)) {
      throw new Error('Invalid GeoGebra command');
    }
  }
  return parsed;
}

export const RENDER_GEOGEBRA_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'render_geogebra',
    description:
      'Render an interactive GeoGebra construction for geometry, angles, triangles, circles, or 3D shapes. Provide GeoGebra commands (e.g. A=(0,0), B=(3,0), Polygon(A,B,C)).',
    parameters: {
      type: 'object',
      properties: {
        appName: { type: 'string', enum: ['graphing', 'geometry', '3d'] },
        width: { type: 'number' },
        height: { type: 'number' },
        commands: {
          type: 'array',
          items: { type: 'string' },
          description: 'GeoGebra commands to execute on load',
        },
        showToolBar: { type: 'boolean' },
      },
      required: ['appName', 'commands'],
      additionalProperties: false,
    },
  },
};
