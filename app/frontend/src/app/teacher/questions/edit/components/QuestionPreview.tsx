'use client';

import React, { useState } from 'react';
import { EditorQuestion, isNumericQuestion, isMultipleChoiceQuestion } from '../types';
import QuestionCard from '@/components/QuestionCard';
import AnswerFeedbackOverlay from '@/components/AnswerFeedbackOverlay';
import MathJaxWrapper from '@/components/MathJaxWrapper';
import type { z } from 'zod';
import { questionDataForStudentSchema } from '@shared/types/socketEvents.zod';
type QuestionDataForStudent = z.infer<typeof questionDataForStudentSchema>;

interface QuestionPreviewProps {
    question: EditorQuestion;
    questionIndex: number;
    totalQuestions: number;
}

export const QuestionPreview: React.FC<QuestionPreviewProps> = ({ question, questionIndex, totalQuestions }) => {
    // State for projection-mode preview (always showing correct answers)
    const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);

    // Convert EditorQuestion to QuestionDataForStudent format
    const convertToQuestionDataForStudent = (editorQuestion: EditorQuestion): QuestionDataForStudent => {
        const baseFields = {
            uid: editorQuestion.uid,
            title: editorQuestion.title,
            text: editorQuestion.text,
            questionType: editorQuestion.questionType,
            timeLimit: editorQuestion.timeLimit || 30,
            currentQuestionIndex: questionIndex,
            totalQuestions: totalQuestions,
        };

        if (isMultipleChoiceQuestion(editorQuestion)) {
            return {
                ...baseFields,
                multipleChoiceQuestion: {
                    answerOptions: editorQuestion.answerOptions,
                },
            };
        } else if (isNumericQuestion(editorQuestion)) {
            return {
                ...baseFields,
                numericQuestion: {
                    unit: undefined,
                },
            };
        }

        return baseFields as QuestionDataForStudent;
    };

    const questionData = convertToQuestionDataForStudent(question);

    // Determine if this is a multiple choice question (needed for QuestionCard)
    const isMultipleChoice = question.questionType === 'single_choice' || question.questionType === 'multiple_choice';

    // No-op handlers for projection mode (not interactive)
    const handleSingleChoice = () => { };
    const handleSubmitMultiple = () => { };
    const handleNumericSubmit = () => { };

    // Get correct answers to display (always shown in projection mode)
    const getCorrectAnswers = (): (boolean | number)[] | undefined => {
        if (isMultipleChoiceQuestion(question)) {
            return question.correctAnswers;
        } else if (isNumericQuestion(question)) {
            return [question.correctAnswer];
        }
        return undefined;
    };

    // Get numeric correct answer data
    const getNumericCorrectAnswer = () => {
        if (!isNumericQuestion(question)) return undefined;
        return {
            correctAnswer: question.correctAnswer,
            tolerance: 0,
        };
    };

    // Get answer options for feedback overlay
    const getAnswerOptions = (): string[] | undefined => {
        if (isMultipleChoiceQuestion(question)) {
            return question.answerOptions;
        }
        return undefined;
    };

    return (
        <div className="bg-card rounded-lg shadow-md border border-border h-full flex flex-col">
            {/* Smartphone Frame */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-hidden bg-gradient-to-br from-muted/30 to-background">
                <div className="relative w-80 max-h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2.5rem] border-4 border-gray-700 shadow-2xl overflow-hidden" style={{ aspectRatio: '9/19.5' }}>
                    {/* Smartphone Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-10 shadow-lg"></div>

                    {/* Screen Content */}
                    <div className="h-full bg-white overflow-hidden flex flex-col relative">
                        {/* Simplified non-clickable navbar */}
                        <div className="flex-shrink-0 bg-[color:var(--navbar)] text-white h-16 flex items-center px-3 pointer-events-none">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <div className="ml-3 text-sm font-medium truncate">{question.title || 'Sans titre'}</div>
                        </div>

                        {/* Question Content with proper padding */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <MathJaxWrapper>
                                <QuestionCard
                                    currentQuestion={questionData}
                                    questionIndex={questionIndex - 1}
                                    totalQuestions={totalQuestions}
                                    isMultipleChoice={isMultipleChoice}
                                    selectedAnswer={null}
                                    setSelectedAnswer={() => { }}
                                    selectedAnswers={[]}
                                    setSelectedAnswers={() => { }}
                                    handleSingleChoice={handleSingleChoice}
                                    handleSubmitMultiple={handleSubmitMultiple}
                                    answered={true}
                                    readonly={true}
                                    projectionMode={true}
                                    isQuizMode={false}
                                    correctAnswers={getCorrectAnswers()}
                                    numericAnswer={isNumericQuestion(question) ? String(question.correctAnswer) : ''}
                                    setNumericAnswer={() => { }}
                                    handleNumericSubmit={handleNumericSubmit}
                                    numericCorrectAnswer={getNumericCorrectAnswer()}
                                />
                            </MathJaxWrapper>
                        </div>

                        {/* Explanation Button (like practice page) */}
                        {question.explanation && (
                            <div className="flex-shrink-0 p-3 border-t border-border bg-muted/20">
                                <button
                                    onClick={() => setShowFeedbackOverlay(true)}
                                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all text-sm font-semibold shadow-sm"
                                >
                                    💡 Voir l&apos;explication
                                </button>
                            </div>
                        )}

                        {/* Feedback Overlay Modal INSIDE smartphone screen */}
                        {showFeedbackOverlay && question.explanation && (
                            <div className="absolute inset-0 z-20">
                                <AnswerFeedbackOverlay
                                    explanation={question.explanation}
                                    duration={10}
                                    onClose={() => setShowFeedbackOverlay(false)}
                                    isCorrect={undefined}
                                    correctAnswers={isMultipleChoiceQuestion(question) ? question.correctAnswers : undefined}
                                    answerOptions={getAnswerOptions()}
                                    allowManualClose={true}
                                    mode="practice"
                                    showTimer={false}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
