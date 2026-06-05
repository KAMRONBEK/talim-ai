import OpenAI from 'openai';
import type { DesmosGraphPayload } from '@talim/types';
import { env } from '../config/env.js';
import { RENDER_GRAPH_TOOL, validateGraphPayload } from '../lib/tutor-graph.js';

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
  | { type: 'graph'; graph: DesmosGraphPayload };

const MAX_TOOL_ROUNDS = 2;

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

export async function generateChatCompletion(messages: ChatMessageInput[]): Promise<string> {
  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: toTextOnlyMessages(messages),
    stream: false,
  });
  return response.choices[0]?.message?.content ?? '';
}

export async function* streamChatCompletion(messages: ChatMessageInput[]): AsyncGenerator<string> {
  const stream = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: toTextOnlyMessages(messages),
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (text) yield text;
  }
}

export async function* streamTutorCompletion(messages: ChatMessageInput[]): AsyncGenerator<string> {
  for await (const event of streamTutorWithTools(messages)) {
    if (event.type === 'text') yield event.text;
  }
}

export async function* streamTutorWithTools(
  messages: ChatMessageInput[],
): AsyncGenerator<TutorStreamEvent> {
  let currentMessages = messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    const stream = await openai.chat.completions.create({
      model: env.TUTOR_MODEL,
      messages: currentMessages,
      tools: [RENDER_GRAPH_TOOL],
      temperature: env.TUTOR_TEMPERATURE,
      stream: true,
    });

    let assistantText = '';
    const toolCallsAcc: Record<
      number,
      { id: string; name: string; arguments: string }
    > = {};
    let finishReason: string | null = null;

    for await (const chunk of stream) {
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
      if (tc.name === 'render_graph') {
        try {
          const raw = JSON.parse(tc.arguments) as unknown;
          const graph = validateGraphPayload(raw);
          yield { type: 'graph', graph };
          currentMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify({
              success: true,
              expressionCount: graph.expressions.length,
            }),
          });
        } catch {
          currentMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify({ success: false, error: 'Invalid graph payload' }),
          });
        }
      } else {
        currentMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify({ success: false, error: 'Unknown tool' }),
        });
      }
    }

    rounds += 1;
  }
}

export async function generateJsonCompletion<T>(messages: ChatMessageInput[]): Promise<T> {
  const text = await generateChatCompletion(messages);
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from AI response');
  }
  return JSON.parse(jsonMatch[0]) as T;
}
