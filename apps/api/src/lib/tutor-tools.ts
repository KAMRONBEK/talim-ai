import crypto from 'node:crypto';
import type { VisualBlock } from '@talim/types';
import { serializeVisualBlock } from '@talim/types';
import type OpenAI from 'openai';
import { validateGraphPayload, RENDER_GRAPH_TOOL } from './tutor-graph.js';
import { validateMermaidPayload, RENDER_MERMAID_TOOL } from './tutor-mermaid.js';
import { validateChartPayload, RENDER_CHART_TOOL } from './tutor-chart.js';
import { validateGeoGebraPayload, RENDER_GEOGEBRA_TOOL } from './tutor-geogebra.js';
import {
  validateHtmlSandboxPayload,
  RENDER_HTML_SANDBOX_TOOL,
} from './tutor-html-sandbox.js';
import {
  validateManimScript,
  buildPendingManimPayload,
  RENDER_MANIM_TOOL,
} from './tutor-manim.js';

export type ToolHandlerResult =
  | { ok: true; block: VisualBlock; toolContent: string; manimJob?: { jobId: string; script: string } }
  | { ok: false; error: string };

export function getTutorTools(): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return [
    RENDER_GRAPH_TOOL,
    RENDER_MERMAID_TOOL,
    RENDER_CHART_TOOL,
    RENDER_GEOGEBRA_TOOL,
    RENDER_HTML_SANDBOX_TOOL,
    RENDER_MANIM_TOOL,
  ];
}

export function handleTutorToolCall(
  name: string,
  argsJson: string,
  manimJobId?: string,
): ToolHandlerResult {
  try {
    const raw = JSON.parse(argsJson) as unknown;

    switch (name) {
      case 'render_graph': {
        const payload = validateGraphPayload(raw);
        const block: VisualBlock = { kind: 'desmos', payload };
        return {
          ok: true,
          block,
          toolContent: JSON.stringify({ success: true, kind: 'desmos', expressionCount: payload.expressions.length }),
        };
      }
      case 'render_mermaid': {
        const payload = validateMermaidPayload(raw);
        const block: VisualBlock = { kind: 'mermaid', payload };
        return {
          ok: true,
          block,
          toolContent: JSON.stringify({ success: true, kind: 'mermaid' }),
        };
      }
      case 'render_chart': {
        const payload = validateChartPayload(raw);
        const block: VisualBlock = { kind: 'chart', payload };
        return {
          ok: true,
          block,
          toolContent: JSON.stringify({ success: true, kind: 'chart', seriesCount: payload.series.length }),
        };
      }
      case 'render_geogebra': {
        const payload = validateGeoGebraPayload(raw);
        const block: VisualBlock = { kind: 'geogebra', payload };
        return {
          ok: true,
          block,
          toolContent: JSON.stringify({ success: true, kind: 'geogebra', commandCount: payload.commands.length }),
        };
      }
      case 'render_html_sim': {
        const payload = validateHtmlSandboxPayload(raw);
        const block: VisualBlock = { kind: 'html-sandbox', payload };
        return {
          ok: true,
          block,
          toolContent: JSON.stringify({ success: true, kind: 'html-sandbox', template: payload.template }),
        };
      }
      case 'render_manim': {
        const script = validateManimScript(raw);
        // Unguessable job id closes the asset-enumeration vector on the
        // (authenticated) manim asset endpoint.
        const jobId = manimJobId ?? `manim-${crypto.randomUUID()}`;
        const payload = buildPendingManimPayload(jobId, script);
        const block: VisualBlock = { kind: 'manim', payload };
        return {
          ok: true,
          block,
          toolContent: JSON.stringify({ success: true, kind: 'manim', jobId, status: 'pending' }),
          manimJob: { jobId, script },
        };
      }
      default:
        return { ok: false, error: 'Unknown tool' };
    }
  } catch {
    return { ok: false, error: 'Invalid payload' };
  }
}

export function serializeBlockForMessage(block: VisualBlock): string {
  return serializeVisualBlock(block);
}
