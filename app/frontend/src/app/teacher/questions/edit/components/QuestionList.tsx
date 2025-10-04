'use client';

import React from 'react';
import MathJaxWrapper from '@/components/MathJaxWrapper';
import { EditorQuestion } from '../types';

interface QuestionListProps {
    questions: EditorQuestion[];
    selectedQuestionIndex: number;
    onSelectQuestion: (index: number) => void;
    onAddQuestion: () => void;
    onDeleteQuestion: (index: number) => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
    questions,
    selectedQuestionIndex,
    onSelectQuestion,
    onAddQuestion,
    onDeleteQuestion,
}) => {
    return (
        <div className="bg-base-100 rounded-lg shadow-md border border-border p-4 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-foreground">Questions</h2>
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
                        aria-selected={selectedQuestionIndex === index}
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
                            <div className="flex-1 min-w-0 overflow-hidden">
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
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteQuestion(index);
                                    }}
                                    className={`absolute top-2 right-2 p-1 rounded-md transition-colors text-alert hover:bg-alert/10`}
                                    title="Supprimer la question"
                                    aria-label={`Supprimer la question ${index + 1}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
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
};