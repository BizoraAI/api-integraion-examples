'use client';

import ReactMarkdown from 'react-markdown';
import { useState, useMemo } from 'react';
import { SourceModal } from './SourceModal';

interface Source {
    node_id: string;
    text?: string;
    s3_file_path?: string;
    tool?: string;
}

interface MarkdownContentProps {
    content: string;
    sources: Source[];
}

export function MarkdownContent({ content, sources }: MarkdownContentProps) {
    const [selectedSource, setSelectedSource] = useState<{ source: Source; number: number } | null>(null);

    // Build a map of node_id -> citation number (1-based, in order of appearance)
    const { processedContent } = useMemo(() => {
        const nodeIdPattern = /\[([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\]/g;
        const map = new Map<string, number>();
        let counter = 1;

        // First pass: assign numbers to unique node IDs in order of appearance
        let match;
        const tempContent = content;
        while ((match = nodeIdPattern.exec(tempContent)) !== null) {
            const nodeId = match[1];
            if (!map.has(nodeId)) {
                map.set(nodeId, counter++);
            }
        }

        // Second pass: replace node IDs with citation markers
        // Use a special marker that won't be interpreted as markdown
        const processed = content.replace(nodeIdPattern, (_, nodeId) => {
            const num = map.get(nodeId);
            return `[[CITE:${nodeId}:${num}]]`;
        });

        return { processedContent: processed };
    }, [content]);

    // Custom component to render citation buttons
    const renderWithCitations = (text: string) => {
        const parts = text.split(/(\[\[CITE:[^\]]+\]\])/g);
        
        return parts.map((part, i) => {
            const citeMatch = part.match(/\[\[CITE:([^:]+):(\d+)\]\]/);
            if (citeMatch) {
                const nodeId = citeMatch[1];
                const num = parseInt(citeMatch[2], 10);
                const source = sources.find(s => s.node_id === nodeId);
                
                // Always render clickable button - show loading state if source not yet available
                return (
                    <button
                        key={i}
                        onClick={() => source && setSelectedSource({ source, number: num })}
                        className={`inline-flex items-center justify-center min-w-5 h-5 px-1 mx-0.5 text-xs font-semibold rounded transition-colors ${
                            source 
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer' 
                                : 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 cursor-wait'
                        }`}
                        title={source ? (source.s3_file_path?.split('/').pop() || 'View source') : 'Loading source...'}
                        disabled={!source}
                    >
                        {num}
                    </button>
                );
            }
            return part;
        });
    };

    return (
        <>
            <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                    components={{
                        // Handle plain text that isn't wrapped in any element
                        text: ({ children }) => <>{renderWithCitations(String(children))}</>,
                        h1: ({ children }) => (
                            <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900 dark:text-white">
                                {typeof children === 'string' ? renderWithCitations(children) : children}
                            </h1>
                        ),
                        h2: ({ children }) => (
                            <h2 className="text-lg font-semibold mt-3 mb-2 text-gray-900 dark:text-white">
                                {typeof children === 'string' ? renderWithCitations(children) : children}
                            </h2>
                        ),
                        h3: ({ children }) => (
                            <h3 className="text-base font-semibold mt-2 mb-1 text-gray-900 dark:text-white">
                                {typeof children === 'string' ? renderWithCitations(children) : children}
                            </h3>
                        ),
                        p: ({ children }) => (
                            <p className="mb-3 leading-relaxed">
                                {typeof children === 'string' ? renderWithCitations(children) : children}
                            </p>
                        ),
                        ul: ({ children }) => (
                            <ul className="list-disc list-outside ml-4 mb-3 space-y-1">{children}</ul>
                        ),
                        ol: ({ children }) => (
                            <ol className="list-decimal list-outside ml-4 mb-3 space-y-1">{children}</ol>
                        ),
                        li: ({ children }) => (
                            <li className="leading-relaxed">
                                {typeof children === 'string' ? renderWithCitations(children) : children}
                            </li>
                        ),
                        strong: ({ children }) => (
                            <strong className="font-semibold">{children}</strong>
                        ),
                        em: ({ children }) => (
                            <em className="italic">{children}</em>
                        ),
                        code: ({ children }) => (
                            <code className="bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono">
                                {children}
                            </code>
                        ),
                        pre: ({ children }) => (
                            <pre className="bg-gray-100 dark:bg-zinc-800 p-3 rounded-lg overflow-x-auto text-sm">
                                {children}
                            </pre>
                        ),
                        blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400">
                                {children}
                            </blockquote>
                        ),
                        a: ({ href, children }) => (
                            <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                {children}
                            </a>
                        ),
                    }}
                >
                    {processedContent}
                </ReactMarkdown>
            </div>

            {/* Source Modal */}
            {selectedSource && (
                <SourceModal
                    source={selectedSource.source}
                    citationNumber={selectedSource.number}
                    onClose={() => setSelectedSource(null)}
                />
            )}
        </>
    );
}
