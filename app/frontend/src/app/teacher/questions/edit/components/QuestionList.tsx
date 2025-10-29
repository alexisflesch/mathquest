'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, ArrowRightFromLine, ArrowLeftFromLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { EditorQuestion } from '../types';
import { QuestionCard } from './QuestionCard';

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
        <div className="bg-base-100 rounded-lg shadow-md border border-border p-2 h-full flex flex-col items-center min-h-0">
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
                        <div key={q.uid} className={`w-10 h-7 rounded-sm shadow-sm border border-border overflow-hidden transition-colors flex-none flex items-center justify-between px-1 cursor-pointer ${borderClass} ${selected ? 'text-primary-foreground' : 'text-muted-foreground'}`} style={selectedBg} onClick={() => onSelectQuestion(i)}>
                            <button
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
        <div className="bg-base-100 rounded-lg shadow-md border border-border p-4 h-full flex flex-col min-h-0">
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
                    aria-label="Ajouter une question"
                >
                    + Ajouter
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {questions.map((question, index) => (
                    <QuestionCard
                        key={question.uid}
                        uid={question.uid}
                        title={question.title}
                        questionType={question.questionType}
                        themes={question.themes}
                        index={index}
                        selected={selectedQuestionIndex === index}
                        problems={problems && problems[index] ? problems[index] : []}
                        onSelect={onSelectQuestion}
                        onDelete={onDeleteQuestion}
                        showDelete={questions.length > 1}
                    />
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
            className="h-full min-h-0 min-w-0 overflow-x-hidden box-border"
        >
            {effectiveCollapsed ? collapsedView : expandedView}
        </motion.div>
    );
};