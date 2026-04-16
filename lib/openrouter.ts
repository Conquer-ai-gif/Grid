// OpenRouter is the PRIMARY AI engine for this platform.
// Uses the openai SDK (v4) pointed at OpenRouter's base URL.
// This gives us multi-model flexibility at production-grade cost efficiency.

import OpenAI from 'openai';

// OpenAI-compatible client pointed at OpenRouter
export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL ?? 'https://grid.vercel.app',
    'X-Title': 'Grid Lecture Platform',
  },
});

export const DEFAULT_MODEL = 'mistralai/mistral-7b-instruct';

export type OpenRouterMessage = OpenAI.Chat.ChatCompletionMessageParam;

// ─── Core call wrapper ────────────────────────────────────────
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  model = DEFAULT_MODEL,
  maxTokens = 1024
): Promise<string> {
  const completion = await openrouter.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
  });
  return completion.choices[0]?.message?.content ?? '';
}

// ─── Streaming wrapper (for Vercel AI SDK chat UI) ────────────
export async function streamOpenRouter(
  messages: OpenRouterMessage[],
  model = DEFAULT_MODEL,
  maxTokens = 1024
) {
  return openrouter.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    stream: true,
  });
}

// ─── Prompt templates ─────────────────────────────────────────

export function buildSummaryPrompt(transcriptText: string): OpenRouterMessage[] {
  return [
    {
      role: 'system',
      content:
        'You are an expert academic summarizer. Given a lecture transcript, produce a structured summary with: key topics, explanations, main points, and suggested assignments. Be concise and educational.',
    },
    {
      role: 'user',
      content: `Summarize this lecture transcript:\n\n${transcriptText}`,
    },
  ];
}

export function buildQuizPrompt(topic: string, transcriptChunk: string): OpenRouterMessage[] {
  return [
    {
      role: 'system',
      content:
        'You are a quiz generator for university courses. Generate a multiple choice question with 4 options and one correct answer. Return ONLY valid JSON in this exact format: {"question":"...","options":["A","B","C","D"],"correct_answer":0} where correct_answer is the 0-based index of the correct option.',
    },
    {
      role: 'user',
      content: `Generate a quiz question about "${topic}" based on this content:\n${transcriptChunk}`,
    },
  ];
}

export function buildQAPrompt(question: string, transcriptContext: string): OpenRouterMessage[] {
  return [
    {
      role: 'system',
      content:
        'You are a helpful academic assistant. Answer questions based strictly on the lecture content provided. If the answer is not in the transcript, say so clearly. Keep answers concise and educational.',
    },
    {
      role: 'user',
      content: `Lecture content:\n${transcriptContext}\n\nStudent question: ${question}`,
    },
  ];
}

export function buildHomeworkPrompt(topic: string): OpenRouterMessage[] {
  return [
    {
      role: 'system',
      content:
        'You are a university lecturer. Create a structured homework assignment with: title, learning objectives (2-3), tasks (3-5 numbered), and submission guidelines. Format as plain text.',
    },
    { role: 'user', content: `Create a homework assignment for the topic: ${topic}` },
  ];
}

export function buildExplanationPrompt(concept: string, context: string): OpenRouterMessage[] {
  return [
    {
      role: 'system',
      content:
        'You are a patient university tutor. Rewrite or explain a concept in a simpler, clearer way. Use analogies where helpful. Target audience: undergraduate students.',
    },
    {
      role: 'user',
      content: `Context from lecture:\n${context}\n\nPlease explain this concept more clearly: ${concept}`,
    },
  ];
}
