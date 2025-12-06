'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface Source {
    node_id?: string;
    text?: string;
    s3_file_path?: string;
    tool?: string;
    title?: string;
    url?: string;
    snippet?: string;
    page_label?: number;
}

interface SourceModalProps {
    source: Source | null;
    citationNumber: number;
    onClose: () => void;
}

export function SourceModal({ source, citationNumber, onClose }: SourceModalProps) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!source) return null;

    const fileName = source.s3_file_path?.split('/').pop() || 'Source';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50" 
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">
                                {citationNumber}
                            </span>
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {fileName}
                            </h3>
                        </div>
                        {source.tool && (
                            <p className="text-xs text-gray-500 mt-1">Source: {source.tool}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {source.text || 'No content available'}
                    </pre>
                </div>
            </div>
        </div>
    );
}
