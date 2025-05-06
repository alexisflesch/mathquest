import React from "react";
import MathJaxWrapper from '@/components/MathJaxWrapper';
import GoodAnswer from '@/components/GoodAnswer';
import WrongAnswer from '@/components/WrongAnswer';

interface TournamentQuestion {
    uid: string;
    question: string;
    type: string | undefined;
    answers?: string[]; // Make optional to support both formats
    reponses?: { texte: string }[]; // Add this for compatibility
}

interface StatsData {
    stats: number[];
    totalAnswers: number;
}

interface TournamentQuestionCardProps {
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
    zoomFactor?: number;  // Conservé pour compatibilité mais n'est plus utilisé
    correctAnswers?: number[]; // Add this prop
    stats?: StatsData; // Optional stats prop for question statistics
    showStats?: boolean; // Whether to display the stats
}

const TournamentQuestionCard: React.FC<TournamentQuestionCardProps> = ({
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
    readonly = false,  // Default to interactive mode
    zoomFactor = 1,    // Conservé mais n'est plus utilisé
    correctAnswers = [], // Add default value
    stats, // Destructure stats
    showStats = false, // Destructure showStats
}) => {
    // For readonly mode, only block pointer events without affecting visual appearance
    const readonlyStyle = readonly ? {
        pointerEvents: 'none' as const, // Blocks all mouse interactions
        userSelect: 'none' as const,    // Prevents text selection
    } : {};

    // Normalize answers: support both { answers: string[] } and { reponses: { texte }[] }
    const answers = Array.isArray(currentQuestion.answers)
        ? currentQuestion.answers
        : Array.isArray(currentQuestion.reponses)
            ? currentQuestion.reponses.map((r) => r.texte)
            : [];
    console.debug('[TournamentQuestionCard] question:', currentQuestion);
    console.debug('[TournamentQuestionCard] answers:', answers);

    return (
        <div className="tqcard-content w-full flex flex-col gap-6 items-center" style={readonlyStyle}>
            {/* Only show question number if not in quiz mode */}
            {!isQuizMode && (
                <h3 className="text-2xl mb-2 font-bold">Question {questionIndex + 1} / {totalQuestions}</h3>
            )}
            {/* Question text */}
            <div className="mb-4 text-xl font-semibold text-center w-full">
                <MathJaxWrapper>{currentQuestion.question}</MathJaxWrapper>
            </div>
            <ul className="flex flex-col w-full">
                {answers.map((answerText: string, idx: number) => {
                    const isSelected = isMultipleChoice
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
                            className={idx !== answers.length - 1 ? "mb-2" : ""}
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
                                    if (isMultipleChoice) {
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
            {isMultipleChoice && (
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

export default TournamentQuestionCard;
export type { TournamentQuestion };
