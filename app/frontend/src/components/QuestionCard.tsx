import React from "react";
import MathJaxWrapper from '@/components/MathJaxWrapper';
import GoodAnswer from '@/components/GoodAnswer';
import WrongAnswer from '@/components/WrongAnswer';
import type { Question, Answer } from '@shared/types/quiz/question'; // Corrected import
import type { LiveQuestionPayload, FilteredQuestion } from '@shared/types/quiz/liveQuestion';
import { createLogger } from '@/clientLogger';

const logger = createLogger('QuestionCard');

// This extends the shared LiveQuestionPayload type and adds any frontend-specific fields
export interface TournamentQuestion extends Omit<LiveQuestionPayload, 'question'> {
    // We allow the question field to be either the FilteredQuestion or the original Question object
    // to support both live_question events and direct question rendering
    question: FilteredQuestion | Question | string;

    // Legacy and additional fields for backward compatibility
    code?: string;
    remainingTime?: number;
    tournoiState?: 'pending' | 'running' | 'paused' | 'stopped' | 'finished';
    uid?: string; // Added uid property for compatibility
    type?: string; // Added type property for compatibility
    answers?: string[]; // Array of answer texts, used if 'question' is a string or as a fallback
}

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
    correctAnswers?: number[]; // Add this prop
    stats?: StatsData; // Optional stats prop for question statistics
    showStats?: boolean; // Whether to display the stats
}

const getQuestionTextToRender = (payload: TournamentQuestion | null): string => {
    if (!payload) return "Question non disponible";
    if (!payload.question) return "Question non disponible";

    if (typeof payload.question === 'string') {
        return payload.question;
    }

    // payload.question is FilteredQuestion | Question
    // Both should have 'text: string'. // MODIFIED: texte -> text
    if (payload.question.text && typeof payload.question.text === 'string' && payload.question.text.trim() !== '') { // MODIFIED: texte -> text
        return payload.question.text; // MODIFIED: texte -> text
    }

    // Fallback for Question type's optional 'question' field if 'text' was empty or not present.
    // This handles cases where the object might be a Question type but missing 'text'.
    if ('question' in payload.question) {
        const qObject = payload.question as Question; // Assert Question type to access 'question'
        if (qObject.question && typeof qObject.question === 'string' && qObject.question.trim() !== '') {
            return qObject.question;
        }
    }

    logger.warn('[QuestionCard] Could not extract question text from object. payload.question:', payload.question);
    return "Question mal formatée"; // Fallback
};

const getAnswersToRender = (payload: TournamentQuestion | null): string[] => {
    if (!payload) return [];

    // Case 1: payload.question is an object (FilteredQuestion or Question)
    if (typeof payload.question === 'object' && payload.question !== null) {
        // The 'answers' property is now mandatory on BaseQuestion, and thus on FilteredQuestion and Question
        if (payload.question.answers && Array.isArray(payload.question.answers)) {
            if (payload.question.answers.length === 0) return [];

            const firstAnswer = payload.question.answers[0];
            if (typeof firstAnswer === 'string') {
                // This means payload.question.answers is string[] (likely from FilteredQuestion)
                return payload.question.answers as string[];
            } else if (typeof firstAnswer === 'object' && firstAnswer !== null && 'text' in firstAnswer) {
                // This means payload.question.answers is Answer[] (likely from Question)
                return (payload.question.answers as Answer[]).map(ans => ans.text);
            }
        }
        logger.warn('[QuestionCard] payload.question is object, but its answers are missing or malformed:', payload.question);
        // Fall through to check top-level payload.answers as a last resort if question object's answers are unusable
    }
    // Case 2: payload.question is a string, or payload.question object's answers were not usable
    else if (typeof payload.question === 'string') {
        if (payload.answers && Array.isArray(payload.answers)) {
            return payload.answers; // Use top-level answers
        }
        logger.warn('[QuestionCard] payload.question is string, but top-level payload.answers is missing or not an array:', payload);
        return [];
    }

    // Fallback: If payload.question was an object but its answers were bad, try the top-level payload.answers.
    if (payload.answers && Array.isArray(payload.answers)) {
        logger.debug('[QuestionCard] getAnswersToRender: Using top-level payload.answers as fallback.');
        return payload.answers;
    }

    logger.warn('[QuestionCard] Could not determine how to extract answers from payload:', payload);
    return [];
};

const QuestionCard: React.FC<QuestionCardProps> = ({
    currentQuestion,
    questionIndex,
    totalQuestions,
    isMultipleChoice, // This prop comes from parent component
    selectedAnswer,
    setSelectedAnswer,
    selectedAnswers,
    setSelectedAnswers,
    handleSingleChoice,
    handleSubmitMultiple,
    answered,
    isQuizMode = true,
    readonly = false,  // Default to interactive mode
    zoomFactor = 1,    // Kept but no longer used // MODIFIED: Translated comment
    correctAnswers = [], // Add default value
    stats, // Destructure stats
    showStats = false, // Destructure showStats
}) => {
    // Helper: determine if this is a multiple choice question based on the question's type
    const isMultipleChoiceQuestion = React.useMemo(() => {
        if (!currentQuestion) return false;

        if (typeof currentQuestion.question === 'object' && currentQuestion.question.type) {
            return currentQuestion.question.type === "choix_multiple";
        }

        return false;
    }, [currentQuestion]);

    // Use either the passed prop or our computed value
    const effectiveIsMultipleChoice = isMultipleChoiceQuestion || isMultipleChoice;

    const questionTextToDisplay = getQuestionTextToRender(currentQuestion);
    const answersToDisplay = getAnswersToRender(currentQuestion);

    // Log what will be displayed
    logger.debug('[QuestionCard] Rendering with questionText:', questionTextToDisplay);
    logger.debug('[QuestionCard] Rendering with answersToDisplay:', answersToDisplay);
    if (answersToDisplay.length === 0) {
        logger.warn('[QuestionCard] Rendering with ZERO answers. Check payload and getAnswersToRender logic.');
    }

    // For readonly mode, only block pointer events without affecting visual appearance
    const readonlyStyle = readonly ? {
        pointerEvents: 'none' as const, // Blocks all mouse interactions
        userSelect: 'none' as const,    // Prevents text selection
    } : {};

    console.debug('[QuestionCard] Rendering with questionText:', questionTextToDisplay, 'answersToDisplay:', answersToDisplay, 'currentQuestion prop:', currentQuestion);

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
                    const isCorrect = correctAnswers.includes(idx);
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
            {effectiveIsMultipleChoice && (
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
