'use client';

import { useState } from 'react';
import { SourceModal } from './SourceModal';

interface Source {
    node_id?: string;
    title?: string;
    url?: string;
    snippet?: string;
    s3_file_path?: string;
    text?: string;
    page_label?: number;
    tool?: string;
}

interface SourceCardProps {
    source: Source;
    citationNumber: number;
}

export function SourceCard({ source, citationNumber }: SourceCardProps) {
    const [showModal, setShowModal] = useState(false);

    const getTitle = () => {
        if (source.title) return source.title;
        if (source.s3_file_path) {
            const parts = source.s3_file_path.split('/');
            return parts[parts.length - 1] || 'Document';
        }
        return 'Document';
    };

    const getSnippet = () => {
        const text = source.snippet || source.text || '';
        return text.length > 100 ? text.slice(0, 100) + '...' : text;
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="p-3 bg-white rounded-lg border shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-xs w-full max-w-[240px] dark:bg-zinc-900 dark:border-zinc-800 dark:text-gray-300 dark:hover:border-blue-600 text-left cursor-pointer"
            >
                <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 bg-blue-600 text-white text-xs font-bold rounded">
                        {citationNumber}
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400 truncate flex-1">
                        {getTitle()}
                    </span>
                </div>
                {source.tool && (
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">
                        via {source.tool}
                    </div>
                )}
                {getSnippet() && (
                    <div className="text-gray-500 line-clamp-2 dark:text-gray-400">
                        {getSnippet()}
                    </div>
                )}
            </button>

            {showModal && (
                <SourceModal
                    source={source}
                    citationNumber={citationNumber}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}
