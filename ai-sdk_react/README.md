# Bizora External API Integration Demo

Demo for integrating Bizora's OpenAI-compatible API with `@ai-sdk/react` (AI SDK v5).

## Setup

1. Get your API key: https://platform.bizora.ai/#api-keys

2. Create `.env.local`:
```
BIZORA_API_KEY=your_api_key_here
BIZORA_API_URL=https://api-bizora.ai
```

3. Run:
```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## Key Implementation

### Frontend (`app/page.tsx`)

Uses AI SDK v5's `useChat` with `DefaultChatTransport`:

```tsx
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

const transport = useMemo(() => new DefaultChatTransport({
  api: '/api/chat',
}), []);

const { messages, sendMessage, status, setMessages } = useChat({ transport });

// Send message with custom body
sendMessage({ text: input }, { body: { deepResearch } });

// Check status
const isLoading = status === 'streaming' || status === 'submitted';

// Messages use parts array (v5 format)
function getMessageText(message) {
  return message.parts
    .filter(p => p.type === 'text')
    .map(p => p.text)
    .join('');
}
```

### Backend (`app/api/chat/route.ts`)

Uses raw `openai` SDK to call Bizora's `/chat/completions` endpoint, then converts to AI SDK stream format:

```ts
import { OpenAI } from 'openai';
import { createUIMessageStream, createUIMessageStreamResponse, generateId } from 'ai';

const client = new OpenAI({
  apiKey: process.env.BIZORA_API_KEY,
  baseURL: process.env.BIZORA_API_URL,
});

export async function POST(req: Request) {
  const { messages, deepResearch } = await req.json();

  // Convert to Bizora format
  // Bizora uses 'human' instead of 'user' and 'ai' instead of 'assistant'
  const openaiMessages = messages.map(m => ({
    role: m.role === 'user' ? 'human' : m.role === 'assistant' ? 'ai' : m.role,
    content: m.parts?.find(p => p.type === 'text')?.text || '',
  }));

  const response = await client.chat.completions.create({
    model: 'bizora-1.0',
    messages: openaiMessages,
    stream: true,
    deepResearch: deepResearch ?? true,
  });

  // Convert to AI SDK v5 UI message stream
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const textId = generateId();
      writer.write({ type: 'text-start', id: textId });

      for await (const chunk of response) {
        // Forward Bizora's custom_data (sources, steps, suggestions)
        if (chunk.custom_data) {
          writer.write({ type: 'data-bizora', data: chunk.custom_data });
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

  return createUIMessageStreamResponse({ stream });
}
```

---

## Bizora-Specific Details

### Custom Data Types

Bizora sends these via `custom_data` in stream chunks:

| Type | Content |
|------|---------|
| `step_message` | `{ title, description }` - Research progress |
| `source_message` | `{ content: Source[] }` - Retrieved sources |
| `suggestions` | `{ suggestions: string[] }` - Follow-up questions |

### Citation Format

Bizora returns inline citations as UUIDs in the response text:
```
The tax code allows deductions [a1b2c3d4-e5f6-7890-abcd-ef1234567890] up to $1M.
```

See `MarkdownContent.tsx` for parsing these into clickable buttons.

### Source Interface

```ts
interface Source {
  node_id: string;      // UUID for citation matching
  title?: string;
  url?: string;
  snippet?: string;
  s3_file_path?: string;
  text?: string;
  page_label?: number;
  tool?: string;
}
```
