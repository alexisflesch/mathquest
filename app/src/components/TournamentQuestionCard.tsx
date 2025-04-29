import React from "react";

interface TournamentQuestion {
    uid: string;
    question: string;
    reponses: { texte: string; correct?: boolean }[];
    type: string;
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
    isQuizMode?: boolean; // <--- Add optional prop
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
    isQuizMode = true, // <--- Default to false
}) => {
    return (
        <div className="tqcard-content w-full flex flex-col gap-6 items-center">
            {/* Only show question number if not in quiz mode */}
            {!isQuizMode && (
                <h3 className="text-2xl mb-2 font-bold">Question {questionIndex + 1} / {totalQuestions}</h3>
            )}
            <div className="mb-4 text-xl font-semibold text-center">
                {currentQuestion.question}
            </div>
            <ul className="flex flex-col w-full">
                {currentQuestion.reponses.map((rep, idx) => {
                    const isSelected = isMultipleChoice
                        ? selectedAnswers.includes(idx)
                        : selectedAnswer === idx;
                    return (
                        <li
                            key={idx}
                            className={idx !== currentQuestion.reponses.length - 1 ? "mb-2" : ""}
                        >
                            <button
                                className={[
                                    "btn-answer w-full text-left transition-colors",
                                    "tqcard-answer",
                                    isSelected ? "tqcard-answer-selected" : "tqcard-answer-unselected"
                                ].join(" ")}
                                onClick={() => {
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
                            >
                                {rep.texte}
                            </button>
                        </li>
                    );
                })}
            </ul>
            {isMultipleChoice && (
                <button
                    className="btn btn-primary mt-2 self-end"
                    onClick={handleSubmitMultiple}
                    disabled={selectedAnswers.length === 0}
                >
                    Valider
                </button>
            )}
        </div>
    );
};

export default TournamentQuestionCard;
