import OpenAI from 'openai';
import type { UsageFeature } from '@prisma/client';
import type { VisualBlock } from '@talim/types';
import { env } from '../config/env.js';
import type { TutorGraphIntent } from '../lib/tutor-graph-intent.js';
import { getTutorTools, handleTutorToolCall } from '../lib/tutor-tools.js';
import { recordUsage } from './usage.service.js';

export interface AiUsageContext {
  userId: string;
  tenantId?: string | null;
  feature: UsageFeature;
  metadata?: Record<string, unknown>;
}

const deepseek = new OpenAI({
  apiKey: env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export type ChatMessageContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    >;

export interface ChatMessageInput {
  role: 'system' | 'user' | 'assistant';
  content: ChatMessageContent;
}

export type TutorStreamEvent =
  | { type: 'text'; text: string }
  | { type: 'visual'; block: VisualBlock }
  | { type: 'manim_enqueue'; jobId: string; script: string };

const MAX_TOOL_ROUNDS = 3;

interface TutorToolOptions {
  graphIntent?: TutorGraphIntent;
}

function toTextOnlyMessages(
  messages: ChatMessageInput[],
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  return messages.map((m) => ({
    role: m.role,
    content:
      typeof m.content === 'string'
        ? m.content
        : m.content
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join('\n'),
  }));
}

function recordCompletionUsage(
  usage: AiUsageContext | undefined,
  model: string,
  response: { usage?: { prompt_tokens?: number; completion_tokens?: number } | null },
): Promise<void> {
  if (!usage) return Promise.resolve();
  return recordUsage({
    userId: usage.userId,
    tenantId: usage.tenantId,
    feature: usage.feature,
    model,
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
    metadata: usage.metadata,
  });
}

type DeepSeekThinking = 'enabled' | 'disabled';

function createDeepSeekChatCompletion(
  messages: ChatMessageInput[],
  options?: { temperature?: number; timeoutMs?: number; thinking?: DeepSeekThinking },
) {
  return deepseek.chat.completions.create(
    {
      model: env.DEEPSEEK_MODEL,
      messages: toTextOnlyMessages(messages),
      ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
      // DeepSeek reads `thinking` as a TOP-LEVEL request param. Nesting it under
      // `extra_body` (a Python-SDK idiom) is silently dropped by the Node SDK, so the
      // control was a no-op and every call ran in the model's default (reasoning) mode.
      // Keep it top-level, and let callers override per-request (the answer judge asks
      // for reasoning so its semantic-equivalence verdicts are accurate).
      thinking: { type: options?.thinking ?? env.DEEPSEEK_THINKING },
    } as any,
    // SDK-level timeout aborts the HTTP request itself (no detached promise races).
    options?.timeoutMs !== undefined ? { timeout: options.timeoutMs } : undefined,
  );
}

function createDeepSeekChatStream(messages: ChatMessageInput[]) {
  return deepseek.chat.completions.create({
    model: env.DEEPSEEK_MODEL,
    messages: toTextOnlyMessages(messages),
    stream: true,
    // Ask for a final usage chunk so streamed completions meter tokens like sync ones.
    stream_options: { include_usage: true },
    thinking: { type: env.DEEPSEEK_THINKING },
  } as any);
}

export async function generateChatCompletion(
  messages: ChatMessageInput[],
  usage?: AiUsageContext,
): Promise<string> {
  const response = await createDeepSeekChatCompletion(messages);
  recordCompletionUsage(usage, env.DEEPSEEK_MODEL, response);
  return response.choices[0]?.message?.content ?? '';
}

export async function* streamChatCompletion(
  messages: ChatMessageInput[],
  usage?: AiUsageContext,
): AsyncGenerator<string> {
  const stream =
    (await createDeepSeekChatStream(messages)) as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

  let finalUsage: { prompt_tokens?: number; completion_tokens?: number } | null = null;
  for await (const chunk of stream) {
    if (chunk.usage) finalUsage = chunk.usage;
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (text) yield text;
  }

  // Fire-and-forget like the sync path; recordUsage swallows its own failures.
  recordCompletionUsage(usage, env.DEEPSEEK_MODEL, { usage: finalUsage });
}

export async function* streamTutorCompletion(messages: ChatMessageInput[]): AsyncGenerator<string> {
  for await (const event of streamTutorWithTools(messages)) {
    if (event.type === 'text') yield event.text;
  }
}

function buildGraphIntentInstruction(intent?: TutorGraphIntent): string | null {
  if (!intent?.isExplicit) return null;

  return `The latest student request explicitly asks to draw, plot, or graph something.
- If you can extract a concrete graphable function, curve, or equation from the latest text or attached image, call render_graph instead of printing raw LaTeX or a code block.
- If the selected image contains a symbolic formula with unspecified coefficients, unknown constants, or an infinite series that cannot be plotted exactly, say what information is missing. Do not invent an exact graph.
- When helpful for teaching, you may call render_graph for a clearly labeled illustrative example, but state that it is illustrative rather than the exact selected expression.
- Keep the explanation brief after the visual.`;
}

function withTutorToolInstructions(
  messages: ChatMessageInput[],
  options?: TutorToolOptions,
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const baseMessages = messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  const graphInstruction = buildGraphIntentInstruction(options?.graphIntent);
  if (!graphInstruction) return baseMessages;

  const instruction: OpenAI.Chat.Completions.ChatCompletionSystemMessageParam = {
    role: 'system',
    content: graphInstruction,
  };
  const firstNonSystemIndex = baseMessages.findIndex((m) => m.role !== 'system');
  if (firstNonSystemIndex === -1) return [...baseMessages, instruction];
  return [
    ...baseMessages.slice(0, firstNonSystemIndex),
    instruction,
    ...baseMessages.slice(firstNonSystemIndex),
  ];
}

export async function* streamTutorWithTools(
  messages: ChatMessageInput[],
  options?: TutorToolOptions & { usage?: AiUsageContext },
): AsyncGenerator<TutorStreamEvent> {
  let currentMessages = withTutorToolInstructions(messages, options);
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    const stream = await openai.chat.completions.create({
      model: env.TUTOR_MODEL,
      messages: currentMessages,
      tools: getTutorTools(),
      temperature: env.TUTOR_TEMPERATURE,
      stream: true,
      stream_options: { include_usage: true },
    });

    let assistantText = '';
    let roundInputTokens = 0;
    let roundOutputTokens = 0;
    const toolCallsAcc: Record<
      number,
      { id: string; name: string; arguments: string }
    > = {};
    let finishReason: string | null = null;

    for await (const chunk of stream) {
      if (chunk.usage) {
        roundInputTokens += chunk.usage.prompt_tokens ?? 0;
        roundOutputTokens += chunk.usage.completion_tokens ?? 0;
      }
      const choice = chunk.choices[0];
      finishReason = choice?.finish_reason ?? finishReason;
      const delta = choice?.delta;

      if (delta?.content) {
        assistantText += delta.content;
        yield { type: 'text', text: delta.content };
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const index = tc.index ?? 0;
          if (!toolCallsAcc[index]) {
            toolCallsAcc[index] = { id: '', name: '', arguments: '' };
          }
          if (tc.id) toolCallsAcc[index].id = tc.id;
          if (tc.function?.name) toolCallsAcc[index].name = tc.function.name;
          if (tc.function?.arguments) {
            toolCallsAcc[index].arguments += tc.function.arguments;
          }
        }
      }
    }

    if (options?.usage && (roundInputTokens > 0 || roundOutputTokens > 0)) {
      recordUsage({
        userId: options.usage.userId,
        tenantId: options.usage.tenantId,
        feature: options.usage.feature,
        model: env.TUTOR_MODEL,
        inputTokens: roundInputTokens,
        outputTokens: roundOutputTokens,
        metadata: options.usage.metadata,
      });
    }

    const toolCalls = Object.values(toolCallsAcc).filter((tc) => tc.id && tc.name);
    if (finishReason !== 'tool_calls' || toolCalls.length === 0) {
      break;
    }

    currentMessages = [
      ...currentMessages,
      {
        role: 'assistant',
        content: assistantText || null,
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: tc.arguments },
        })),
      },
    ];

    for (const tc of toolCalls) {
      const result = handleTutorToolCall(tc.name, tc.arguments);
      if (result.ok) {
        yield { type: 'visual', block: result.block };
        if (result.manimJob) {
          yield {
            type: 'manim_enqueue',
            jobId: result.manimJob.jobId,
            script: result.manimJob.script,
          };
        }
        currentMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result.toolContent,
        });
      } else {
        currentMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify({ success: false, error: result.error }),
        });
      }
    }

    rounds += 1;
  }
}

export async function generateJsonCompletion<T>(
  messages: ChatMessageInput[],
  options?: {
    temperature?: number;
    timeoutMs?: number;
    usage?: AiUsageContext;
    thinking?: DeepSeekThinking;
  },
): Promise<T> {
  const response = await createDeepSeekChatCompletion(messages, options);
  // Await so usage is persisted before any subsequent quota check (sequential
  // generation loops, e.g. auto-generating a deck per section).
  await recordCompletionUsage(options?.usage, env.DEEPSEEK_MODEL, response);
  const text = response.choices[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from AI response');
  }
  return JSON.parse(jsonMatch[0]) as T;
}
