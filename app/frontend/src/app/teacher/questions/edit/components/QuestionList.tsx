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
                    className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:opacity-90 transition-all shadow-sm"
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
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedQuestionIndex === index
                            ? 'bg-primary/30 border-primary shadow ring-2 ring-primary/50 hover:!bg-primary/30'
                            : 'bg-background border-border hover:bg-muted/40'
                            }`}
                        onClick={() => onSelectQuestion(index)}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary`}>
                                        {question.questionType === 'numeric' ? 'Numérique' :
                                            question.questionType === 'single_choice' ? 'Choix unique' : 'Choix multiple'}
                                    </span>
                                    <span className="text-xs text-muted-foreground/70">•</span>
                                    <span className={`text-xs font-medium ${selectedQuestionIndex === index ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                                        {question.discipline || 'Sans discipline'}
                                    </span>
                                </div>
                                <h3 className={`text-xs font-semibold truncate mb-1 text-foreground`}>
                                    {question.title || 'Sans titre'}
                                </h3>
                                <div className="text-xs truncate text-muted-foreground">
                                    <MathJaxWrapper>
                                        <div className="truncate">{question.text}</div>
                                    </MathJaxWrapper>
                                </div>
                            </div>
                            {questions.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteQuestion(index);
                                    }}
                                    className={`ml-3 p-2 rounded-md transition-colors text-alert hover:bg-alert/10`}
                                    title="Supprimer la question"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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