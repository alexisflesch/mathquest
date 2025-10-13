import React from "react";
import MathJaxWrapper from '@/components/MathJaxWrapper';
import GoodAnswer from '@/components/GoodAnswer';
import WrongAnswer from '@/components/WrongAnswer';
import type { Question, Answer } from '@shared/types/quiz/question'; // Corrected import
import type { z } from 'zod';
import { questionDataForStudentSchema } from '@shared/types/socketEvents.zod';
type QuestionDataForStudent = z.infer<typeof questionDataForStudentSchema>;
import { QUESTION_TYPES } from '@shared/types';
import { createLogger } from '@/clientLogger';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

const logger = createLogger('QuestionCard');

// Utility function to check if a numeric answer is correct
const isNumericAnswerCorrect = (
    userAnswer: number | string,
    correctData: { correctAnswer: number; tolerance?: number }
): boolean => {
    const parsedUserAnswer = typeof userAnswer === 'string' ? parseFloat(userAnswer) : userAnswer;
    if (isNaN(parsedUserAnswer)) return false;

    const tolerance = correctData.tolerance || 0;
    const difference = Math.abs(parsedUserAnswer - correctData.correctAnswer);
    return difference <= tolerance;
};

// NOTE: TournamentQuestion interface is now imported from shared types
// This local definition has been replaced by the canonical shared type

interface StatsData {
    stats: number[];
    totalAnswers: number;
}

import type { QuestionData } from '@shared/types/socketEvents';

// Accept only QuestionDataForStudent for student payloads
type CanonicalQuestionCard = QuestionDataForStudent;

interface QuestionCardProps {
    currentQuestion: CanonicalQuestionCard;
    questionIndex: number;
    totalQuestions: number;
    isMultipleChoice: boolean;
    selectedAnswer: number | null;
    setSelectedAnswer: (idx: number | null) => void;
    selectedAnswers: number[];
    setSelectedAnswers: (cb: (prev: number[]) => number[]) => void;
    handleSingleChoice: (idx: number) => void;
    handleSubmitMultiple: () => void;
    answered: boolean;
    isQuizMode?: boolean; // Whether to show question numbers
    readonly?: boolean;   // New prop to make the component display-only
    projectionMode?: boolean; // New prop for projection page - hides input fields completely
    zoomFactor?: number;  // Kept for compatibility but no longer used // MODIFIED: Translated comment
    correctAnswers?: (boolean | number | string)[]; // Changed to accept mixed array for both MC (boolean) and numeric (number) questions
    stats?: StatsData; // Optional stats prop for question statistics
    showStats?: boolean; // Whether to display the stats
    // Numeric question props
    numericAnswer?: number | string; // Current numeric answer value
    setNumericAnswer?: (value: string) => void; // Handler for numeric input - simplified to string only
    handleNumericSubmit?: () => void; // Handler for numeric question submission
    // Numeric answer correctness data (for show_answers phase)
    numericCorrectAnswer?: {
        correctAnswer: number;
        tolerance?: number;
    } | null;
}

// Helper to get the question type (for multiple choice detection)
const getQuestionType = (q: CanonicalQuestionCard | string): string | undefined => {
    if (typeof q === 'object' && q !== null) {
        // FilteredQuestion uses 'defaultMode', QuestionDataForStudent uses 'questionType'
        if ('defaultMode' in q && typeof q.defaultMode === 'string') return q.defaultMode;
        if ('questionType' in q && typeof q.questionType === 'string') return q.questionType;
    }
    return undefined;
};

// Updated helper functions using canonical shared type fields directly
const getQuestionTextToRender = (payload: CanonicalQuestionCard | null): string => {
    if (!payload) return "Question non disponible";
    try {
        if (typeof payload.text === 'string') {
            return payload.text;
        }
        return "Question mal formatée";
    } catch (error) {
        logger.warn('[QuestionCard] Error extracting question text:', error);
        return "Question mal formatée";
    }
};

const getAnswersToRender = (payload: CanonicalQuestionCard | null): string[] => {
    if (!payload) return [];
    try {
        // Use the polymorphic structure
        if (payload.multipleChoiceQuestion?.answerOptions && Array.isArray(payload.multipleChoiceQuestion.answerOptions)) {
            return payload.multipleChoiceQuestion.answerOptions;
        }
        return [];
    } catch (error) {
        logger.warn('[QuestionCard] Error extracting answers:', error);
        return [];
    }
};

const QuestionCard: React.FC<QuestionCardProps> = ({
    currentQuestion,
    questionIndex,
    totalQuestions,
    isMultipleChoice,
    selectedAnswer,
    setSelectedAnswer,
    selectedAnswers,
    setSelectedAnswers,
    handleSingleChoice,
    handleSubmitMultiple,
    answered,
    isQuizMode = true,
    readonly = false,
    projectionMode = false,
    zoomFactor = 1,
    correctAnswers = [],
    stats,
    showStats = false,
    numericAnswer = '',
    setNumericAnswer,
    handleNumericSubmit,
    numericCorrectAnswer,
}) => {
    // Use shared type helpers for type detection
    const isMultipleChoiceQuestion = React.useMemo(() => {
        if (!currentQuestion) return false;
        const t = getQuestionType(currentQuestion);
        return t === QUESTION_TYPES.MULTIPLE_CHOICE;
    }, [currentQuestion]);

    const isNumericQuestion = React.useMemo(() => {
        if (!currentQuestion) return false;
        const t = getQuestionType(currentQuestion);
        return t === QUESTION_TYPES.NUMERIC;
    }, [currentQuestion]);

    // Use either the passed prop or our computed value
    const effectiveIsMultipleChoice = isMultipleChoiceQuestion || isMultipleChoice;

    const questionTextToDisplay = getQuestionTextToRender(currentQuestion);
    const answersToDisplay = getAnswersToRender(currentQuestion);

    // Log what will be displayed (only when answers are missing)
    if (answersToDisplay.length === 0) {
        logger.warn('[QuestionCard] Rendering with ZERO answers. Check payload and getAnswersToRender logic.');
    }

    // For readonly mode, only block pointer events without affecting visual appearance
    const readonlyStyle = readonly ? {
        pointerEvents: 'none' as const, // Blocks all mouse interactions
        userSelect: 'none' as const,    // Prevents text selection
    } : {};

    return (
        <div className={`tqcard-content w-full flex flex-col items-center ${projectionMode && isNumericQuestion ? 'gap-2' : 'gap-6'}`} style={readonlyStyle}>
            {/* Only show question number if not in quiz mode */}
            {!isQuizMode && (
                <h3 className="text-2xl mb-2 font-bold">Question {questionIndex + 1} / {totalQuestions}</h3>
            )}
            {/* Question text */}
            <div
                className={`font-semibold text-center w-full question-text-in-live-page ${projectionMode && isNumericQuestion ? 'mb-1' : 'mb-4'}`}
                // Inline style: allow the MathJax container to expand vertically while preserving horizontal scrolling.
                // alignSelf/stretch and minHeight:0 help avoid flexbox compression from ancestors.
                style={{ display: 'block', alignSelf: 'stretch', minHeight: 0 as any, overflowX: 'auto', overflowY: 'visible' }}
            >
                <MathJaxWrapper zoomFactor={zoomFactor}>{questionTextToDisplay}</MathJaxWrapper>
            </div>

            {/* Conditional rendering based on question type */}
            {isNumericQuestion ? (
                <div className="w-full flex flex-col">
                    {/* Show input only when NOT in projection mode */}
                    {!projectionMode && (
                        <>
                            <div className="relative w-full">
                                <input
                                    id="numeric-answer"
                                    type="number"
                                    inputMode="decimal"
                                    value={numericAnswer}
                                    onChange={(e) => setNumericAnswer?.(e.target.value)}
                                    placeholder="Votre réponse"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 text-lg"
                                    disabled={readonly}
                                    aria-disabled={readonly}
                                    step="any"
                                    autoFocus={!readonly}
                                    style={{
                                        paddingRight: readonly && numericCorrectAnswer && numericAnswer ? 40 : 12,
                                        borderColor: 'var(--gray-300)',
                                        boxShadow: 'none',
                                    }}
                                    onFocus={e => {
                                        e.target.style.boxShadow = '0 0 0 2px var(--primary)';
                                        e.target.style.borderColor = 'var(--primary)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.boxShadow = 'none';
                                        e.target.style.borderColor = 'var(--gray-300)';
                                    }}
                                    onKeyDown={e => {
                                        if (
                                            e.key === 'Enter' &&
                                            !readonly &&
                                            (typeof numericAnswer === 'string' ? numericAnswer.trim() : numericAnswer)
                                        ) {
                                            e.preventDefault();
                                            handleNumericSubmit?.();
                                        }
                                    }}
                                />
                                {/* Visual feedback for numeric answers when correct answers are shown - positioned inside input field */}
                                {readonly && numericCorrectAnswer && numericAnswer && (
                                    <div
                                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {isNumericAnswerCorrect(numericAnswer, numericCorrectAnswer) ? (
                                            <GoodAnswer size={20} iconColor="var(--success)" />
                                        ) : (
                                            <WrongAnswer size={20} iconColor="var(--alert)" />
                                        )}
                                    </div>
                                )}
                            </div>
                            {!readonly && (
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={handleNumericSubmit}
                                        className="btn btn-primary btn-sm"
                                        disabled={typeof numericAnswer === 'string' ? !numericAnswer.trim() : !numericAnswer}
                                        style={{ minWidth: 90 }}
                                    >
                                        Valider
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Large projection-style correct answer display for numeric questions */}
                    {projectionMode && readonly && correctAnswers && correctAnswers.length > 0 && (
                        <div className="mt-0 w-full flex flex-col items-start justify-center">
                            <div className="text-lg font-bold" style={{ color: 'var(--success)' }}>
                                Réponse : {correctAnswers[0]}
                            </div>
                        </div>
                    )}

                    {/* Show correct answer info when in readonly mode (non-projection) */}
                    {!projectionMode && readonly && numericCorrectAnswer && (
                        <div className="mt-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium" style={{ color: 'var(--success)' }}>Réponse correcte :</span>
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{numericCorrectAnswer.correctAnswer}</span>
                                {numericCorrectAnswer.tolerance !== undefined && numericCorrectAnswer.tolerance > 0 && (
                                    <span className="text-gray-500">
                                        (±{numericCorrectAnswer.tolerance})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // Multiple choice questions
                <>
                    <ul className="flex flex-col w-full min-w-0">
                        {answersToDisplay.map((answerText: string, idx: number) => {
                            const isSelected = effectiveIsMultipleChoice
                                ? selectedAnswers.includes(idx)
                                : selectedAnswer === idx;
                            const isCorrect = correctAnswers && correctAnswers[idx] === true;
                            const showGood = readonly && isCorrect;
                            const showWrong = readonly && isSelected && !isCorrect;
                            let statPercent: number | null = null;
                            if (showStats && stats && Array.isArray(stats.stats) && typeof stats.stats[idx] === 'number') {
                                statPercent = stats.stats[idx];
                            } else {
                                statPercent = null;
                            }
                            // Detect display-mode LaTeX (\[ ... \] or \begin{...}) in the answer text.
                            const hasDisplayMath = typeof answerText === 'string' && (/\\\[|\\begin\{/).test(answerText);

                            return (
                                <li
                                    key={idx}
                                    className={(idx !== answersToDisplay.length - 1 ? "mb-2 " : "") + "min-w-0"}
                                    style={{ position: 'relative' }}
                                >
                                    <button
                                        className={[
                                            "btn-answer w-full text-left transition-colors",
                                            "tqcard-answer",
                                            isSelected ? "tqcard-answer-selected" : "tqcard-answer-unselected"
                                        ].join(" ")}
                                        onClick={() => {
                                            if (readonly) return;
                                            if (effectiveIsMultipleChoice) {
                                                setSelectedAnswers((prev) =>
                                                    prev.includes(idx)
                                                        ? prev.filter((i) => i !== idx)
                                                        : [...prev, idx]
                                                );
                                            } else {
                                                handleSingleChoice(idx);
                                            }
                                        }}
                                        disabled={false}
                                        aria-disabled={readonly}
                                        tabIndex={readonly ? -1 : 0}
                                        style={{
                                            display: 'flex',
                                            alignItems: hasDisplayMath ? 'flex-start' : 'center',
                                            justifyContent: 'space-between',
                                            position: 'relative',
                                            // Let inner content manage horizontal scroll; avoid nested scrollbars on button itself
                                            overflowX: 'visible',
                                            overflowY: 'visible',
                                            // Relax minHeight for answers containing display math so the button can grow
                                            minHeight: hasDisplayMath ? 'auto' : undefined,
                                            paddingTop: hasDisplayMath ? '0.75rem' : undefined,
                                            paddingBottom: hasDisplayMath ? '0.75rem' : undefined,
                                        }}
                                    >
                                        {/* Histogram bar as background */}
                                        {showStats && statPercent !== null && (
                                            <div
                                                className="histogram-bar-bg"
                                                style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: `${statPercent}%`,
                                                    background: 'var(--bar-stat, #b3e5fc)',
                                                    // Remove border radius for square corners
                                                    zIndex: 0,
                                                    pointerEvents: 'none',
                                                    transition: 'width 0.3s',
                                                }}
                                            />
                                        )}
                                        {/* Button content above the bar */}
                                        {/* Badge strip above content (shown when readonly and correct/wrong) */}
                                        {/* Right-side container: percentage and icons appear here visually but are absolutely positioned so the text can use full width */}
                                        {(showStats && statPercent !== null) || showGood || showWrong ? (
                                            <div className="answer-side-container" style={{ zIndex: 2 }}>
                                                {showStats && statPercent !== null && (
                                                    <span style={{ textAlign: 'right', fontWeight: 600, color: 'var(--foreground)' }}>
                                                        {statPercent.toFixed(1)}%
                                                    </span>
                                                )}
                                                {showGood && (
                                                    <span className="badge bg-primary text-primary-content ml-2 flex items-center justify-center" style={{ minWidth: 28, minHeight: 28, padding: 0, marginLeft: showStats ? 8 : 0 }}>
                                                        <GoodAnswer size={18} iconColor="currentColor" />
                                                    </span>
                                                )}
                                                {showWrong && (
                                                    <span className="badge bg-alert text-alert-content ml-2 flex items-center justify-center" style={{ minWidth: 28, minHeight: 28, padding: 0, marginLeft: showStats ? 8 : 0 }}>
                                                        <WrongAnswer size={18} iconColor="currentColor" />
                                                    </span>
                                                )}
                                            </div>
                                        ) : null}

                                        {/* Left content: allow shrink, do NOT own horizontal scrollbars. Text can use full width now. */}
                                        <span style={{ display: 'block', alignItems: 'flex-start', position: 'relative', zIndex: 1, width: '100%', minWidth: 0, overflowX: 'visible', overflowY: 'visible' }}>
                                            {/* Ensure answers scale with the same zoomFactor as the question text */}
                                            <MathJaxWrapper zoomFactor={zoomFactor}>{answerText}</MathJaxWrapper>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    {effectiveIsMultipleChoice && !readonly && (
                        <button
                            className="btn btn-primary mt-2 self-end"
                            onClick={handleSubmitMultiple}
                            disabled={readonly || selectedAnswers.length === 0}
                            aria-disabled={readonly || selectedAnswers.length === 0}
                        >
                            Valider
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default QuestionCard;
