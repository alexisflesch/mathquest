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
        <div className="bg-card rounded-lg shadow-md border border-border p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-foreground">Questions</h2>
                <button
                    onClick={onAddQuestion}
                    className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:opacity-90 transition-all shadow-sm"
                >
                    + Ajouter
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
                {questions.map((question, index) => (
                    <div
                        key={question.uid}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${selectedQuestionIndex === index
                            ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02] ring-2 ring-primary/30'
                            : 'bg-background border-border hover:border-primary/50 hover:shadow-md hover:scale-[1.01]'
                            }`}
                        onClick={() => onSelectQuestion(index)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${selectedQuestionIndex === index
                                        ? 'bg-primary-foreground text-primary'
                                        : 'bg-primary/10 text-primary'
                                        }`}>
                                        {question.questionType === 'numeric' ? 'Numérique' :
                                            question.questionType === 'single_choice' ? 'Choix unique' : 'Choix multiple'}
                                    </span>
                                    <span className={`text-xs ${selectedQuestionIndex === index ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>•</span>
                                    <span className={`text-xs font-medium ${selectedQuestionIndex === index ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                                        {question.discipline || 'Sans discipline'}
                                    </span>
                                </div>
                                <h3 className={`text-sm font-bold truncate mb-1 ${selectedQuestionIndex === index ? 'text-primary-foreground' : 'text-foreground'}`}>
                                    {question.title || 'Sans titre'}
                                </h3>
                                <p className={`text-xs truncate ${selectedQuestionIndex === index ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                    {question.text}
                                </p>
                            </div>
                            {questions.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteQuestion(index);
                                    }}
                                    className={`ml-3 p-2 rounded-md transition-all ${selectedQuestionIndex === index
                                        ? 'text-primary-foreground hover:bg-primary-foreground/20'
                                        : 'text-alert hover:bg-alert/10'
                                        }`}
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