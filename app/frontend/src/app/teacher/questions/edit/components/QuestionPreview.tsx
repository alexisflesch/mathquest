'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Timer as TimerIcon } from 'lucide-react';
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
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Pixel 7 inner viewport dimensions (CSS pixels)
    const PHONE_WIDTH = 412;
    const PHONE_HEIGHT = 922; // Slightly adjusted to approximate Pixel 7 visible area
    // Visual frame border in px (must match border-[3px])
    const PHONE_BORDER = 3;
    // Outer visual size including border (box-shadow is visually clipped by container overflow)
    const OUTER_PHONE_WIDTH = PHONE_WIDTH + 2 * PHONE_BORDER;
    const OUTER_PHONE_HEIGHT = PHONE_HEIGHT + 2 * PHONE_BORDER;

    // Calculate scale factor to fit container
    useEffect(() => {
        const updateScale = () => {
            const container = containerRef.current;
            if (!container) return;

            // Use computed paddings to get true available content box
            const styles = window.getComputedStyle(container);
            const padX = parseFloat(styles.paddingLeft || '0') + parseFloat(styles.paddingRight || '0');
            const padY = parseFloat(styles.paddingTop || '0') + parseFloat(styles.paddingBottom || '0');

            const availableWidth = container.clientWidth - padX;
            const availableHeight = container.clientHeight - padY;

            // Fit the OUTER phone box (including border) into available area
            const scaleX = availableWidth / OUTER_PHONE_WIDTH;
            const scaleY = availableHeight / OUTER_PHONE_HEIGHT;
            const newScale = Math.min(scaleX, scaleY, 1); // Never scale up beyond 1

            setScale(Number.isFinite(newScale) && newScale > 0 ? newScale : 1);
        };

        updateScale();

        // Track container size changes precisely
        const ro = new ResizeObserver(() => updateScale());
        if (containerRef.current) ro.observe(containerRef.current);

        window.addEventListener('resize', updateScale);
        return () => {
            window.removeEventListener('resize', updateScale);
            ro.disconnect();
        };
    }, []);

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
        <div className="h-full flex flex-col overflow-hidden bg-transparent">
            {/* Smartphone Frame */}
            <div
                ref={containerRef}
                className="flex-1 flex items-start justify-center p-0 overflow-hidden bg-transparent"
            >
                {/* Wrapper that takes up scaled outer phone space (prevents overflow) */}
                <div
                    style={{
                        width: `${OUTER_PHONE_WIDTH * scale}px`,
                        height: `${OUTER_PHONE_HEIGHT * scale}px`,
                        position: 'relative'
                    }}
                >
                    {/* Pixel 7 dimensions: 412x915 CSS pixels, dynamically scaled to fit */}
                    <div
                        className="absolute top-0 left-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2rem] border-[3px] border-gray-700 overflow-hidden"
                        style={{
                            width: `${PHONE_WIDTH}px`,
                            height: `${PHONE_HEIGHT}px`,
                            transform: `scale(${scale})`,
                            transformOrigin: 'top left'
                        }}
                    >
                        {/* Screen Content */}
                        <div className="h-full bg-base-200 overflow-hidden flex flex-col relative">
                            {/* Device Status Bar (time, signal, wifi, battery) */}
                            <div
                                className="flex-shrink-0 h-6 flex items-center justify-between px-3"
                                style={{ background: 'var(--navbar)', color: 'var(--light-foreground)' }}
                            >
                                {/* Time */}
                                <div className="text-[11px] font-semibold tracking-wide">9:41</div>

                                {/* Icons */}
                                <div className="flex items-center gap-1 text-[color:var(--light-foreground)]">
                                    {/* Cellular bars */}
                                    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="2" y="7" width="2" height="3" rx="0.5" fill="currentColor" />
                                        <rect x="6" y="5" width="2" height="5" rx="0.5" fill="currentColor" />
                                        <rect x="10" y="3" width="2" height="7" rx="0.5" fill="currentColor" />
                                        <rect x="14" y="1" width="2" height="9" rx="0.5" fill="currentColor" />
                                    </svg>
                                    {/* WiFi */}
                                    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 4.5C4.5 1.5 11.5 1.5 15 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M3 7C6 4.5 10 4.5 13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M6 9.5C7.5 8.5 8.5 8.5 10 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <circle cx="8" cy="11" r="1" fill="currentColor" />
                                    </svg>
                                    {/* Battery */}
                                    <svg width="22" height="12" viewBox="0 0 22 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="1" y="1" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                        <rect x="3" y="3" width="12" height="6" rx="1" fill="currentColor" />
                                        <rect x="19.5" y="4" width="2" height="4" rx="0.5" fill="currentColor" />
                                    </svg>
                                </div>
                            </div>
                            {/* Simplified non-clickable navbar */}
                            <div className="flex-shrink-0 bg-[color:var(--navbar)] text-white h-16 flex items-center px-3 pointer-events-none">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                <div className="ml-3 text-sm font-medium truncate">
                                    <MathJaxWrapper zoomFactor={0.95}>{question.title || 'Sans titre'}</MathJaxWrapper>
                                </div>
                            </div>

                            {/* Floating timer chip (mirror TournamentTimer mobile) */}
                            <div
                                className="absolute right-4 z-50 navbar-timer-bg px-4 py-2 rounded-full shadow-lg border border-primary"
                                style={{ background: 'var(--navbar)', color: 'var(--primary-foreground)', top: 'calc(1.5rem + 5rem + 0.5rem)' }}
                            >
                                <div className="flex items-center gap-1 align-middle">
                                    <TimerIcon className="w-5 h-5" style={{ display: 'block', color: 'var(--light-foreground)' }} />
                                    <span className="text-lg font-bold flex items-center leading-none" style={{ color: 'var(--light-foreground)' }}>
                                        {(() => {
                                            const val = (question.timeLimit || 30); // seconds
                                            if (val === null || val === undefined || val < 0) return '0';
                                            const rounded = Math.max(0, Math.floor(val));
                                            if (rounded >= 60) {
                                                const m = Math.floor(rounded / 60);
                                                const s = rounded % 60;
                                                return `${m}:${s.toString().padStart(2, '0')}`;
                                            }
                                            return rounded.toString();
                                        })()}
                                    </span>
                                </div>
                            </div>

                            {/* Question Content: vertically centered card like live main-content */}
                            <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
                                {/* Card container to mirror practice page */}
                                <div className="card w-full max-w-2xl bg-base-100 shadow-xl my-6 relative">
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

                                    {/* Practice-like controls row (no next/bilan) */}
                                    {question.explanation && (
                                        <div className="mt-4">
                                            <div className="flex justify-start items-center">
                                                <button
                                                    className="btn btn-outline btn-sm flex items-center gap-2"
                                                    onClick={() => setShowFeedbackOverlay(true)}
                                                    title="Explication"
                                                >
                                                    <MessageCircle size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>


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
                    {/* Close wrapper div */}
                </div>
            </div>
        </div>
    );
};
