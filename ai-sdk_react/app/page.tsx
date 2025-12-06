'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Sparkles, Plus, Bot, ArrowDown, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { StepIndicator } from '@/components/StepIndicator';
import { SourceCard } from '@/components/SourceCard';
import { MarkdownContent } from '@/components/MarkdownContent';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import clsx from 'clsx';

interface Source {
  node_id: string;
  title?: string;
  url?: string;
  snippet?: string;
  s3_file_path?: string;
  text?: string;
  page_label?: number;
  tool?: string;
}

interface StreamData {
  type: string;
  title?: string;
  description?: string;
  content?: Source[];
  suggestions?: string[];
  sources?: Source[];
}

interface MessageType {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: Array<{ type: string; text?: string; data?: unknown }>;
}

const INITIAL_SOURCES_COUNT = 6;

// Helper to extract text from message parts
function getMessageText(message: MessageType): string {
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
    .map(p => p.text)
    .join('');
}

// Helper to extract data parts from message (Bizora custom data)
function getDataParts(message: MessageType): StreamData[] {
  return message.parts
    .filter((p): p is { type: string; data: StreamData } => 
      p.type.startsWith('data-') && p.data !== undefined
    )
    .map(p => p.data);
}

// Extract sources from stream data
function extractSources(streamData: StreamData[]): Source[] {
  const allSources = streamData
    .filter(d => d?.type === 'source_message' || d?.type === 'ai_metadata')
    .flatMap(m => {
      if (m.type === 'source_message') return m.content || [];
      if (m.type === 'ai_metadata') return m.sources || [];
      return [];
    });

  return allSources.filter((source, index, self): source is Source =>
    !!source.node_id && self.findIndex(s => s.node_id === source.node_id) === index
  );
}

// Extract steps from stream data
function extractSteps(streamData: StreamData[]) {
  return streamData
    .filter(d => d?.type === 'step_message')
    .map(d => ({
      title: d.title || 'Processing...',
      description: d.description,
      type: 'step' as const,
    }));
}

// Extract suggestions from stream data
function extractSuggestions(streamData: StreamData[]): string[] {
  return streamData
    .filter(d => d?.type === 'suggestions')
    .flatMap(m => m.suggestions || []);
}

function ExpandableSources({ sources }: { sources: Source[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = sources.length > INITIAL_SOURCES_COUNT;
  const displayedSources = expanded ? sources : sources.slice(0, INITIAL_SOURCES_COUNT);
  const hiddenCount = sources.length - INITIAL_SOURCES_COUNT;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Sources ({sources.length})
      </h4>
      <div className="flex flex-wrap gap-2">
        {displayedSources.map((src, i) => (
          <SourceCard key={src.node_id || i} source={src} citationNumber={i + 1} />
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Show {hiddenCount} more source{hiddenCount > 1 ? 's' : ''}
            </>
          )}
        </button>
      )}
    </div>
  );
}

// Assistant message component that handles its own data extraction
function AssistantMessage({ 
  message, 
  isLast, 
  isLoading,
  onSuggestionClick 
}: { 
  message: MessageType; 
  isLast: boolean;
  isLoading: boolean;
  onSuggestionClick: (suggestion: string) => void;
}) {
  const messageText = getMessageText(message);
  const streamData = getDataParts(message);
  const sources = extractSources(streamData);
  const steps = extractSteps(streamData);
  const suggestions = extractSuggestions(streamData);

  // Show steps: always show if there are steps, show loading state only for last message
  const isCurrentlyLoading = isLast && isLoading;
  const showSteps = steps.length > 0 || isCurrentlyLoading;
  // Show sources: always show if there are sources (but not while this message is loading)
  const showSources = sources.length > 0 && !isCurrentlyLoading;
  // Show suggestions: only for the last completed message
  const showSuggestions = isLast && !isLoading && messageText && suggestions.length > 0;

  return (
    <>
      {/* Steps indicator above message */}
      {showSteps && (
        <div className="mb-4">
          <StepIndicator steps={steps} isFinished={!isCurrentlyLoading} />
        </div>
      )}

      {/* Message bubble */}
      <div className="flex w-full space-x-4 justify-start">
        <div className="flex max-w-[80%] rounded-2xl px-4 py-3 shadow-sm bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-zinc-800">
          <div className="mr-3 shrink-0 self-start mt-1">
            <Bot className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="leading-relaxed">
              {messageText ? (
                <MarkdownContent content={messageText} sources={sources} />
              ) : isLoading && isLast ? (
                <div className="flex items-center min-h-6">
                  <LoadingIndicator />
                </div>
              ) : null}
            </div>

            {/* Sources below message content */}
            {showSources && <ExpandableSources sources={sources} />}
          </div>
        </div>
      </div>

      {/* Suggestions below message */}
      {showSuggestions && (
        <div className="max-w-md mt-4">
          <div className="space-y-2">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Related questions</p>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick(s)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <span className="flex-1">{s}</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// User message component
function UserMessage({ message }: { message: MessageType }) {
  const messageText = getMessageText(message);

  return (
    <div className="flex w-full space-x-4 justify-end">
      <div className="flex max-w-[80%] rounded-2xl px-4 py-3 shadow-sm bg-blue-600 text-white">
        <div className="flex-1 overflow-hidden">
          <div className="leading-relaxed">
            <span className="whitespace-pre-wrap">{messageText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [deepResearch, setDeepResearch] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [input, setInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Create transport once with stable id
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
  }), []);

  // Use the AI SDK v5 useChat hook with DefaultChatTransport
  const { messages, sendMessage, status, setMessages, stop } = useChat({ 
    id: 'bizora-chat',
    transport,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Get last assistant message id
  const lastAssistantId = useMemo(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    return assistantMessages[assistantMessages.length - 1]?.id;
  }, [messages]);

  // Track if user manually scrolled up
  const userScrolledUp = useRef(false);
  const lastScrollTop = useRef(0);

  // Handle scroll - detect user scrolling up to disable auto-scroll
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;

    // Detect if user scrolled up (scroll position decreased)
    if (scrollTop < lastScrollTop.current - 10) {
      userScrolledUp.current = true;
      setAutoScroll(false);
    }
    lastScrollTop.current = scrollTop;

    // Show scroll button when not near bottom and loading
    setShowScrollButton(!nearBottom && isLoading);

    // Re-enable auto-scroll only if user scrolled back to bottom manually
    if (nearBottom && userScrolledUp.current) {
      userScrolledUp.current = false;
      setAutoScroll(true);
    }
  }, [isLoading]);

  const scrollToBottom = useCallback(() => {
    userScrolledUp.current = false;
    setAutoScroll(true);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto-scroll only when streaming and autoScroll is enabled
  useEffect(() => {
    if (autoScroll && isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, autoScroll, isLoading]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setAutoScroll(true);
    sendMessage({ text: input }, { body: { deepResearch } });
    setInput('');
  }, [input, isLoading, sendMessage, deepResearch]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setAutoScroll(true);
    sendMessage({ text: suggestion }, { body: { deepResearch } });
  }, [sendMessage, deepResearch]);

  const handleNewChat = () => {
    stop(); // Abort any ongoing request so status returns to 'ready'
    setMessages([]);
    setAutoScroll(true);
  };

  return (
    <main className="flex h-screen flex-col bg-gray-50 dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bizora AI</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDeepResearch(!deepResearch)}
              className={clsx(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                deepResearch ? "bg-blue-600" : "bg-gray-200 dark:bg-zinc-700"
              )}
            >
              <span className="sr-only">Enable Deep Research</span>
              <span
                className={clsx(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  deepResearch ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Deep Research</span>
            <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-2" />
            <button
              onClick={handleNewChat}
              className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-6 overflow-y-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {messages.length === 0 && (
          <div className="mt-20 text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              How can I help you today?
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Ask about Section 179, tax codes, or financial planning.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id}>
            {m.role === 'assistant' ? (
              <AssistantMessage 
                message={m as MessageType}
                isLast={m.id === lastAssistantId}
                isLoading={isLoading}
                onSuggestionClick={handleSuggestionClick}
              />
            ) : m.role === 'user' ? (
              <UserMessage message={m as MessageType} />
            ) : null}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-20"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* Input Area */}
      <div className="shrink-0 p-4 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center">
          <input
            className="w-full p-4 pr-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white transition-all shadow-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={status !== 'ready'}
            autoFocus
          />
          <button
            type="submit"
            disabled={status !== 'ready' || !input}
            className="absolute right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </main>
  );
}
