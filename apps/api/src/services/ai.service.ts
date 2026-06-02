import OpenAI from 'openai';
import { env } from '../config/env.js';

const deepseek = new OpenAI({
  apiKey: env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export interface ChatMessageInput {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateChatCompletion(messages: ChatMessageInput[]): Promise<string> {
  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages,
    stream: false,
  });
  return response.choices[0]?.message?.content ?? '';
}

export async function* streamChatCompletion(messages: ChatMessageInput[]): AsyncGenerator<string> {
  const stream = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (text) yield text;
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
