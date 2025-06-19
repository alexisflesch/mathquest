import React from "react";
import MathJaxWrapper from '@/components/MathJaxWrapper';
import GoodAnswer from '@/components/GoodAnswer';
import WrongAnswer from '@/components/WrongAnswer';
import type { Question, Answer } from '@shared/types/quiz/question'; // Corrected import
import type { LiveQuestionPayload, FilteredQuestion } from '@shared/types/quiz/liveQuestion';
import type { QuestionData, TournamentQuestion } from '@shared/types/socketEvents';
import { QUESTION_TYPES } from '@shared/types';
import { createLogger } from '@/clientLogger';

const logger = createLogger('QuestionCard');

// NOTE: TournamentQuestion interface is now imported from shared types
// This local definition has been replaced by the canonical shared type

interface StatsData {
    stats: number[];
    totalAnswers: number;
}

interface QuestionCardProps {
    currentQuestion: TournamentQuestion;
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
    zoomFactor?: number;  // Kept for compatibility but no longer used // MODIFIED: Translated comment
    correctAnswers?: boolean[]; // Changed to accept boolean array directly
    stats?: StatsData; // Optional stats prop for question statistics
    showStats?: boolean; // Whether to display the stats
}

// Helper to get the question type (for multiple choice detection)
const getQuestionType = (q: FilteredQuestion | QuestionData | string): string | undefined => {
    if (typeof q === 'object' && q !== null) {
        // FilteredQuestion uses 'defaultMode', QuestionData uses 'questionType'
        if ('defaultMode' in q && typeof q.defaultMode === 'string') return q.defaultMode;
        if ('questionType' in q && typeof q.questionType === 'string') return q.questionType;
    }
    return undefined;
};

// Updated helper functions using canonical shared type fields directly
const getQuestionTextToRender = (payload: TournamentQuestion | null): string => {
    if (!payload) return "Question non disponible";
    try {
        const { question } = payload;

        if (typeof question === 'string') {
            return question;
        }

        if (typeof question === 'object' && question !== null) {
            if ('text' in question && typeof question.text === 'string') {
                return question.text;
            }
        }

        return "Question mal formatée";
    } catch (error) {
        logger.warn('[QuestionCard] Error extracting question text:', error);
        return "Question mal formatée";
    }
};

const getAnswersToRender = (payload: TournamentQuestion | null): string[] => {
    if (!payload) return [];
    try {
        const { question } = payload;

        if (typeof question === 'object' && question !== null) {
            // Use canonical answerOptions field only
            if ('answerOptions' in question && Array.isArray(question.answerOptions)) {
                return question.answerOptions;
            }
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
    zoomFactor = 1,
    correctAnswers = [],
    stats,
    showStats = false,
}) => {
    // Use shared type helpers for type detection
    const isMultipleChoiceQuestion = React.useMemo(() => {
        if (!currentQuestion) return false;
        const t = getQuestionType(currentQuestion.question);
        return t === QUESTION_TYPES.MULTIPLE_CHOICE;
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
        <div className="tqcard-content w-full flex flex-col gap-6 items-center" style={readonlyStyle}>
            {/* Only show question number if not in quiz mode */}
            {!isQuizMode && (
                <h3 className="text-2xl mb-2 font-bold">Question {questionIndex + 1} / {totalQuestions}</h3>
            )}
            {/* Question text */}
            <div className="mb-4 text-xl font-semibold text-center w-full">
                <MathJaxWrapper>{questionTextToDisplay}</MathJaxWrapper>
            </div>
            <ul className="flex flex-col w-full">
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
                    }
                    return (
                        <li
                            key={idx}
                            className={idx !== answersToDisplay.length - 1 ? "mb-2" : ""}
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
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}
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
                                <span style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                                    <MathJaxWrapper>{answerText}</MathJaxWrapper>
                                </span>
                                {/* Right-aligned percentage and icon */}
                                <span style={{ display: 'flex', alignItems: 'center', minWidth: 48, marginLeft: 'auto', position: 'relative', zIndex: 1 }}>
                                    {showStats && statPercent !== null && (
                                        <span style={{ textAlign: 'right', fontWeight: 600, color: 'var(--foreground)' }}>
                                            {statPercent.toFixed(1)}%
                                        </span>
                                    )}
                                    {showGood && (
                                        <span className="badge bg-primary text-primary-content ml-2 flex items-center justify-center" style={{ minWidth: 28, minHeight: 28, padding: 0 }}>
                                            <GoodAnswer size={18} iconColor="currentColor" />
                                        </span>
                                    )}
                                    {showWrong && (
                                        <span className="badge bg-alert text-alert-content ml-2 flex items-center justify-center" style={{ minWidth: 28, minHeight: 28, padding: 0 }}>
                                            <WrongAnswer size={18} iconColor="currentColor" />
                                        </span>
                                    )}
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
        </div>
    );
};

export default QuestionCard;
