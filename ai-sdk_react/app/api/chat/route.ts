import { OpenAI } from 'openai';
import { createUIMessageStream, createUIMessageStreamResponse, generateId } from 'ai';

const client = new OpenAI({
  apiKey: process.env.BIZORA_API_KEY || '',
  baseURL: process.env.BIZORA_API_URL || 'https://api-bizora.ai',
});

export async function POST(req: Request) {
  const { messages, deepResearch } = await req.json();

  // Convert UI messages (parts format) to Bizora API format
  // Bizora uses 'human' instead of 'user' and 'ai' instead of 'assistant'
  const openaiMessages = messages.map(
    (m: { role: string; parts?: { type: string; text?: string }[] }) => ({
      role: m.role === 'user' ? 'human' : m.role === 'assistant' ? 'ai' : m.role,
      content: m.parts?.find((p: { type: string }) => p.type === 'text')?.text || '',
    })
  );

  // Debug: log what we're sending to Bizora
  console.log('Sending to Bizora API:', JSON.stringify(openaiMessages, null, 2));

  const response = await client.chat.completions.create({
    model: 'bizora-1.0',
    messages: openaiMessages,
    stream: true,
    deepResearch: deepResearch ?? true,
  } as Parameters<typeof client.chat.completions.create>[0]) as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

  // Create UI message stream for AI SDK v5 frontend
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const textId = generateId();
      writer.write({ type: 'text-start', id: textId });

      for await (const chunk of response) {
        // Forward custom_data (sources, steps, suggestions)
        const customData = (chunk as unknown as { custom_data?: Record<string, unknown> }).custom_data;
        if (customData) {
          writer.write({ type: 'data-bizora', data: customData });
        }

        // Forward text content
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
          writer.write({ type: 'text-delta', id: textId, delta: content });
        }
      }

      writer.write({ type: 'text-end', id: textId });
    },
  });

  // Return as proper SSE response
  return createUIMessageStreamResponse({ stream });
}
