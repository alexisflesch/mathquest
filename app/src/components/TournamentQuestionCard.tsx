import React from "react";
import MathJaxWrapper from '@/components/MathJaxWrapper';
import GoodAnswer from '@/components/GoodAnswer';
import WrongAnswer from '@/components/WrongAnswer';

interface TournamentQuestion {
    uid: string;
    question: string;
    reponses: { texte: string; correct?: boolean }[];
    type: string | undefined;
    discipline: string;
    theme: string;
    difficulte: number;
    niveau: string;
    auteur?: string;
    explication?: string;
    tags?: string[];
    temps?: number;
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
}) => {
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
            {/* Question text - enlever les styles de zoom */}
            <div className="mb-4 text-xl font-semibold text-center w-full">
                <MathJaxWrapper>{currentQuestion.question}</MathJaxWrapper>
            </div>
            <ul className="flex flex-col w-full">
                {currentQuestion.reponses.map((rep, idx) => {
                    // Show selection even in readonly mode
                    const isSelected = isMultipleChoice
                        ? selectedAnswers.includes(idx)
                        : selectedAnswer === idx;
                    const isCorrect = correctAnswers.includes(idx);
                    // Show wrong if selected but not correct (readonly mode)
                    const showGood = readonly && isCorrect;
                    const showWrong = readonly && isSelected && !isCorrect;
                    return (
                        <li
                            key={idx}
                            className={idx !== currentQuestion.reponses.length - 1 ? "mb-2" : ""}
                            style={{ position: 'relative' }}
                        >
                            <button
                                className={[
                                    "btn-answer w-full text-left transition-colors",
                                    "tqcard-answer",
                                    isSelected ? "tqcard-answer-selected" : "tqcard-answer-unselected"
                                ].join(" ")}
                                onClick={() => {
                                    if (readonly) return; // No action in readonly mode
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
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                    <MathJaxWrapper>{rep.texte}</MathJaxWrapper>
                                </span>
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
