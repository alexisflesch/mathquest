'use client';

import React from 'react';
import { AlertTriangle, XCircle, Trash2 } from 'lucide-react';
import MathJaxWrapper from '@/components/MathJaxWrapper';
import { EditorQuestion } from '../types';

interface QuestionCardProps {
    uid: string;
    title: string | undefined;
    questionType: 'single_choice' | 'multiple_choice' | 'numeric';
    themes: string[] | undefined;
    index: number;
    selected: boolean;
    problems: Array<{ type: 'error' | 'warning'; message: string }>;
    onSelect: (index: number) => void;
    onDelete: (index: number) => void;
    showDelete: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = React.memo(({
    uid,
    title,
    questionType,
    themes,
    index,
    selected,
    problems,
    onSelect,
    onDelete,
    showDelete,
}) => {
    const hasError = problems.some(x => x.type === 'error');
    const hasWarning = !hasError && problems.some(x => x.type === 'warning');

    return (
        <div
            role="button"
            className={`relative p-4 rounded-lg border cursor-pointer transition-colors flex items-start ${selected
                ? 'border-border text-foreground shadow-md ring-1'
                : 'bg-background border-border hover:bg-muted/40'
                }`}
            style={selected ? { backgroundColor: 'rgba(6,182,212,0.12)' } : undefined}
            onClick={() => onSelect(index)}
        >
            {/* left accent when selected (in-flow to avoid clipping) */}
            <div className="flex items-start justify-between gap-2 w-full">
                {/* no in-flow accent to avoid layout shift; use background tint only */}
                <div className="flex-1 min-w-0 overflow-hidden pr-8">
                    {/* First row: Title */}
                    <h3 className={`text-sm font-semibold break-words leading-tight mb-1 ${selected ? 'text-primary-foreground' : 'text-foreground'} pl-0`}>
                        <MathJaxWrapper zoomFactor={1} constrainWidth={true}>{title || 'Sans titre'}</MathJaxWrapper>
                    </h3>

                    {/* Second row: Type (QCM/QCU/Numérique) and themes (left-aligned, truncated) */}
                    <div className="flex items-center gap-2 mb-2 justify-start pl-0">
                        <span className={`inline-flex items-center justify-start w-auto text-[10px] font-semibold uppercase pl-0 pr-2 py-0.5 rounded text-left ${selected ? 'text-primary-foreground' : 'text-primary'}`}>
                            {questionType === 'numeric' ? 'Numérique' :
                                questionType === 'single_choice' ? 'QCU' : 'QCM'}
                        </span>
                        <span className="text-xs text-muted-foreground/70">•</span>
                        <span className={`text-xs font-medium ${selected ? 'text-primary-foreground' : 'text-muted-foreground'} text-left max-w-[160px] truncate min-w-0`}>
                            {Array.isArray(themes) && themes.length > 0 ? themes.join(', ') : 'Sans thèmes'}
                        </span>
                    </div>

                    {/* question preview removed by request to avoid overflow in cards */}
                </div>
                {showDelete && (
                    // Move delete icon to top-right corner
                    <>
                        {/* Absolute container for delete button + badge to ensure consistent placement */}
                        <div className="absolute top-2 right-2 flex flex-col items-center gap-0 z-20">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(index);
                                }}
                                className={`p-1 rounded-md transition-colors text-alert hover:bg-alert/10`}
                                title="Supprimer la question"
                                aria-label={`Supprimer la question ${index + 1}`}
                            >
                                <Trash2 size={18} aria-hidden />
                            </button>

                            {problems.length > 0 && (() => {
                                const errors = problems.filter(x => x.type === 'error');
                                const warnings = problems.filter(x => x.type === 'warning');

                                // Render both icons when both present. Error icon should be above warning.
                                return (
                                    <>
                                        {errors.length > 0 && (
                                            <button
                                                className="p-1 rounded-full bg-transparent hover:bg-alert/10"
                                                title={errors.map(x => x.message).join('; ')}
                                                aria-label={`Erreur: ${errors.length}`}
                                            >
                                                <XCircle size={18} className="text-red-600" />
                                            </button>
                                        )}

                                        {warnings.length > 0 && (
                                            <button
                                                className="p-1 rounded-full bg-transparent hover:bg-amber-100"
                                                title={warnings.map(x => x.message).join('; ')}
                                                aria-label={`Avertissement: ${warnings.length}`}
                                            >
                                                <AlertTriangle size={18} className="text-amber-500" />
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
});

QuestionCard.displayName = 'QuestionCard';