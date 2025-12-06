import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, ChevronDown, ChevronRight, BrainCircuit } from 'lucide-react';
import clsx from 'clsx';

export interface Step {
    title: string;
    description?: string;
    type?: 'step' | 'enrichment' | 'source_analysis';
}

export function StepIndicator({ steps, isFinished }: { steps: Step[]; isFinished: boolean }) {
    const [isOpen, setIsOpen] = useState(!isFinished);

    // Auto-expand when new steps come in if not explicitly closed? 
    // Usually Grok keeps it open while thinking, collapsed when done.
    useEffect(() => {
        if (!isFinished && steps.length > 0) {
            setIsOpen(true);
        } else if (isFinished) {
            setIsOpen(false);
        }
    }, [isFinished, steps.length]);

    if (steps.length === 0) return null;

    return (
        <div className="w-full max-w-2xl my-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <div className="flex items-center space-x-2">
                    {isFinished ? (
                        <span className="font-medium">Thought Process Finished</span>
                    ) : (
                        <span className="font-medium animate-pulse">Thinking...</span>
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="mt-3 ml-2 pl-4 border-l-2 border-gray-100 dark:border-zinc-800 space-y-4">
                    {steps.map((step, idx) => (
                        <div key={idx} className="relative group">
                            <div className="flex items-start">
                                <div className="mr-3 mt-0.5">
                                    {isFinished || idx < steps.length - 1 ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {step.title}
                                    </p>
                                    {step.description && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-mono bg-gray-50 dark:bg-zinc-900/50 p-2 rounded">
                                            {step.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
