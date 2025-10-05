'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, XCircle, Trash2, ArrowRightFromLine, ArrowLeftFromLine } from 'lucide-react';
import { motion } from 'framer-motion';
import MathJaxWrapper from '@/components/MathJaxWrapper';
import { EditorQuestion } from '../types';

interface QuestionListProps {
    questions: EditorQuestion[];
    selectedQuestionIndex: number;
    onSelectQuestion: (index: number) => void;
    onAddQuestion: () => void;
    onDeleteQuestion: (index: number) => void;
    // Per-question problems computed by parent. Array aligned with `questions`.
    problems?: Array<Array<{ type: 'error' | 'warning'; message: string }>>;
    // New: whether the sidebar is currently collapsed (narrow)
    sidebarCollapsed?: boolean;
    // New: callback to toggle collapse state
    onToggleSidebar?: () => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
    questions,
    selectedQuestionIndex,
    onSelectQuestion,
    onAddQuestion,
    onDeleteQuestion,
    problems,
    sidebarCollapsed = false,
    onToggleSidebar,
}) => {
    // No logging here to avoid spamming console during typing or frequent re-renders.
    // Track whether we're on a small (mobile) viewport so we can force-expanded
    // behaviour: on mobile we always show the expanded list and hide the
    // collapse/expand burger button.
    const [isMobile, setIsMobile] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth <= 768;
    });

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // If on mobile, ignore the collapsed state and always render expanded
    const effectiveCollapsed = sidebarCollapsed && !isMobile;

    // We'll render a single container and animate its width. Inside, we render
    // either the compact collapsed view or the full expanded view.
    const collapsedView = (
        <div className="bg-base-100 rounded-lg shadow-md border border-border p-2 h-full flex flex-col items-center overflow-hidden">
            <div className="w-full flex items-center justify-start mb-2">
                {/* Top-left toggle */}
                <div className="pl-1">
                    <button
                        onClick={() => onToggleSidebar && onToggleSidebar()}
                        aria-label={sidebarCollapsed ? 'Expand questions list' : 'Collapse questions list'}
                        className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted/50"
                    >
                        {sidebarCollapsed ? (
                            <ArrowRightFromLine className="w-4 h-4 text-foreground" aria-hidden />
                        ) : (
                            <ArrowLeftFromLine className="w-4 h-4 text-foreground" aria-hidden />
                        )}
                    </button>
                </div>
            </div>

            {/* Compact stacked small cards for questions */}
            <div className="flex-1 w-full overflow-y-auto overflow-x-hidden py-1 flex flex-col items-center gap-1">
                {questions.map((q, i) => {
                    const p = problems && problems[i] ? problems[i] : [];
                    const hasError = p.some(x => x.type === 'error');
                    const hasWarning = !hasError && p.some(x => x.type === 'warning');
                    const selected = selectedQuestionIndex === i;

                    // tiny card styles: show a left border when error/warning
                    const borderClass = hasError ? 'border-l-4 border-red-600' : hasWarning ? 'border-l-4 border-amber-500' : '';
                    const selectedBg = selected ? { backgroundColor: 'rgba(6,182,212,0.12)' } : undefined;

                    return (
                        <div key={q.uid} className={`w-10 h-7 rounded-sm shadow-sm border border-border overflow-hidden transition-colors flex-none flex items-center justify-between px-1 ${borderClass} ${selected ? 'text-primary-foreground' : 'text-muted-foreground'}`} style={selectedBg}>
                            <button
                                onClick={() => onSelectQuestion(i)}
                                title={q.title || `Question ${i + 1}`}
                                aria-label={`Question ${i + 1}`}
                                className="flex items-center gap-1 text-sm font-semibold"
                            >
                                <span className="pl-0">{i + 1}</span>
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteQuestion(i);
                                }}
                                aria-label={`Supprimer la question ${i + 1}`}
                                title="Supprimer la question"
                                className="w-4 h-4 rounded-sm flex items-center justify-center bg-transparent p-0"
                            >
                                <Trash2 size={12} className="text-alert" />
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="w-full flex items-center justify-center pt-2">
                <button
                    onClick={onAddQuestion}
                    className="px-3 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:opacity-90 transition-all"
                    aria-label="Ajouter une question"
                >
                    +
                </button>
            </div>
        </div>
    );

    const expandedView = (
        <div className="bg-base-100 rounded-lg shadow-md border border-border p-4 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                {/* Top-left toggle */}
                <div className="flex items-center gap-2">
                    {/* Removed global problem counters - per-item icons shown next to each question */}

                    <button
                        onClick={() => onToggleSidebar && onToggleSidebar()}
                        aria-label={sidebarCollapsed ? 'Expand questions list' : 'Collapse questions list'}
                        // Hide the collapse/expand button on small screens - mobile should always be expanded
                        className="hidden md:flex w-8 h-8 rounded-md items-center justify-center hover:bg-muted/50"
                    >
                        {sidebarCollapsed ? (
                            <ArrowRightFromLine className="w-4 h-4 text-foreground" aria-hidden />
                        ) : (
                            <ArrowLeftFromLine className="w-4 h-4 text-foreground" aria-hidden />
                        )}
                    </button>

                    <h2 className="text-xl font-bold text-foreground">Questions</h2>
                </div>

                <button
                    onClick={onAddQuestion}
                    className="px-4 py-2 text-foreground font-semibold text-sm rounded-md hover:opacity-90 transition-all border border-border hover:border-foreground"
                >
                    + Ajouter
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {questions.map((question, index) => (
                    <div
                        key={question.uid}
                        role="button"
                        className={`relative p-4 rounded-lg border cursor-pointer transition-colors flex items-start ${selectedQuestionIndex === index
                            ? 'border-border text-foreground shadow-md ring-1'
                            : 'bg-background border-border hover:bg-muted/40'
                            }`}
                        style={selectedQuestionIndex === index ? { backgroundColor: 'rgba(6,182,212,0.12)' } : undefined}
                        onClick={() => onSelectQuestion(index)}
                    >
                        {/* left accent when selected (in-flow to avoid clipping) */}
                        <div className="flex items-start justify-between gap-2 w-full">
                            {/* no in-flow accent to avoid layout shift; use background tint only */}
                            <div className="flex-1 min-w-0 overflow-hidden pr-8">
                                {/* First row: Title */}
                                <h3 className={`text-sm font-semibold truncate mb-1 ${selectedQuestionIndex === index ? 'text-primary-foreground' : 'text-foreground'} pl-0`}>
                                    <MathJaxWrapper zoomFactor={1}>{question.title || 'Sans titre'}</MathJaxWrapper>
                                </h3>

                                {/* Second row: Type (QCM/QCU/Numérique) and themes (left-aligned, truncated) */}
                                <div className="flex items-center gap-2 mb-2 justify-start pl-0">
                                    <span className={`inline-flex items-center justify-start w-auto text-[10px] font-semibold uppercase pl-0 pr-2 py-0.5 rounded text-left ${selectedQuestionIndex === index ? 'text-primary-foreground' : 'text-primary'}`}>
                                        {question.questionType === 'numeric' ? 'Numérique' :
                                            question.questionType === 'single_choice' ? 'QCU' : 'QCM'}
                                    </span>
                                    <span className="text-xs text-muted-foreground/70">•</span>
                                    <span className={`text-xs font-medium ${selectedQuestionIndex === index ? 'text-primary-foreground' : 'text-muted-foreground'} text-left max-w-[160px] truncate min-w-0`}>
                                        {Array.isArray(question.themes) && question.themes.length > 0 ? question.themes.join(', ') : 'Sans thèmes'}
                                    </span>
                                </div>

                                <div className="text-[10px] truncate text-muted-foreground">
                                    <MathJaxWrapper zoomFactor={0.95}>
                                        <div className="truncate">{question.text}</div>
                                    </MathJaxWrapper>
                                </div>
                            </div>
                            {questions.length > 1 && (
                                // Move delete icon to top-right corner
                                <>
                                    {/* Absolute container for delete button + badge to ensure consistent placement */}
                                    <div className="absolute top-2 right-2 flex flex-col items-center gap-0 z-20">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteQuestion(index);
                                            }}
                                            className={`p-1 rounded-md transition-colors text-alert hover:bg-alert/10`}
                                            title="Supprimer la question"
                                            aria-label={`Supprimer la question ${index + 1}`}
                                        >
                                            <Trash2 size={18} aria-hidden />
                                        </button>

                                        {problems && problems[index] && problems[index].length > 0 && (() => {
                                            const p = problems[index];
                                            const errors = p.filter(x => x.type === 'error');
                                            const warnings = p.filter(x => x.type === 'warning');

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
                ))}
            </div>

            {questions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p className="text-base mb-4">Aucune question</p>
                    <button
                        onClick={onAddQuestion}
                        className="px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:opacity-90 transition-all shadow-md"
                    >
                        Créer la première question
                    </button>
                </div>
            )}
        </div>
    );

    const sidebarWidth = effectiveCollapsed ? '4rem' : (isMobile ? '100%' : '18rem');

    return (
        <motion.div
            initial={false}
            animate={{ width: isMobile ? '100%' : sidebarWidth }}
            transition={isMobile ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 30 }}
            style={{ width: isMobile ? '100%' : sidebarWidth }}
            className="h-full"
        >
            {effectiveCollapsed ? collapsedView : expandedView}
        </motion.div>
    );
};