'use client';

import React from 'react';
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
        <div className="bg-card rounded-lg shadow-sm border border-border p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-lg font-semibold text-foreground">Questions</h2>
                <button
                    onClick={onAddQuestion}
                    className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors"
                >
                    + Ajouter
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                {questions.map((question, index) => (
                    <div
                        key={question.uid}
                        className={`p-3 rounded-md border-2 cursor-pointer transition-colors ${selectedQuestionIndex === index
                            ? 'bg-primary/10 border-primary shadow-md'
                            : 'bg-muted border-border hover:bg-muted/80'
                            }`}
                        onClick={() => onSelectQuestion(index)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">
                                        {question.questionType === 'numeric' ? 'Numérique' :
                                            question.questionType === 'single_choice' ? 'Choix unique' : 'Choix multiple'}
                                    </span>
                                    <span className="text-xs text-muted-foreground/70">•</span>
                                    <span className="text-xs text-muted-foreground">
                                        {question.discipline || 'Sans discipline'}
                                    </span>
                                </div>
                                <h3 className="text-sm font-medium text-foreground truncate">
                                    {question.title || 'Sans titre'}
                                </h3>
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                    {question.text}
                                </p>
                            </div>
                            {questions.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteQuestion(index);
                                    }}
                                    className="ml-2 p-1 text-destructive hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                    title="Supprimer la question"
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
                <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Aucune question</p>
                    <button
                        onClick={onAddQuestion}
                        className="mt-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors"
                    >
                        Créer la première question
                    </button>
                </div>
            )}
        </div>
    );
};