'use client';

import React, { useRef, useEffect } from 'react';
import QuestionCard from '@/components/QuestionCard';
import { createLogger } from '@/clientLogger';
import type { z } from 'zod';
import { questionDataForStudentSchema } from '@shared/types/socketEvents.zod';

type QuestionDataForStudent = z.infer<typeof questionDataForStudentSchema>;

const logger = createLogger('QuestionDisplay');

interface QuestionDisplayProps {
    currentQuestion: QuestionDataForStudent | null;
    questionIndex: number;
    totalQuestions: number;
    isMultipleChoice: boolean;
    selectedAnswer: number | null;
    setSelectedAnswer: (answer: number | null) => void;
    selectedAnswers: number[];
    setSelectedAnswers: (cb: (prev: number[]) => number[]) => void;
    handleSingleChoice: (idx: number) => void;
    handleSubmitMultiple: () => void;
    answered: boolean;
    isQuizMode: boolean;
    correctAnswers: boolean[] | undefined;
    readonly: boolean;
    gameStatus: string;
    connecting: boolean;
    connected: boolean;
    currentQuestionUid: string | undefined;
    numericAnswer?: string;
    setNumericAnswer?: (value: string) => void;
    handleNumericSubmit?: () => void;
    numericCorrectAnswer?: {
        correctAnswer: number;
        tolerance?: number;
    } | null;
}

// Memoized Question Display Component
const QuestionDisplay = React.memo(({
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
    isQuizMode,
    correctAnswers,
    readonly,
    gameStatus,
    connecting,
    connected,
    currentQuestionUid,
    numericAnswer,
    setNumericAnswer,
    handleNumericSubmit,
    numericCorrectAnswer
}: QuestionDisplayProps) => {
    // Re-render logging for QuestionDisplay (only in debug mode)
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());

    useEffect(() => {
        renderCount.current++;
        const now = Date.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;

        if (typeof window !== 'undefined' && window.location.search?.includes('mqdebug=1')) {
            logger.info(`🔄 [QUESTION-RERENDER] QuestionDisplay re-render #${renderCount.current} (${timeSinceLastRender}ms since last)`);
        }
    });

    if (currentQuestion) {
        return (
            <QuestionCard
                key={currentQuestionUid}
                currentQuestion={currentQuestion}
                questionIndex={questionIndex}
                totalQuestions={totalQuestions}
                isMultipleChoice={isMultipleChoice}
                selectedAnswer={selectedAnswer}
                setSelectedAnswer={setSelectedAnswer}
                selectedAnswers={selectedAnswers}
                setSelectedAnswers={setSelectedAnswers}
                handleSingleChoice={handleSingleChoice}
                handleSubmitMultiple={handleSubmitMultiple}
                answered={answered}
                isQuizMode={isQuizMode}
                correctAnswers={correctAnswers}
                readonly={readonly}
                numericAnswer={numericAnswer}
                setNumericAnswer={setNumericAnswer}
                handleNumericSubmit={handleNumericSubmit}
                numericCorrectAnswer={numericCorrectAnswer}
            />
        );
    }

    return (
        <div className="text-center text-lg text-gray-500 p-8">
            {gameStatus === 'completed' ? (
                <>
                    <div className="text-2xl mb-4">🎉 Jeu terminé !</div>
                    <div>Redirection vers le classement...</div>
                </>
            ) : connecting ? 'Connexion...' :
                !connected ? 'Connexion en cours...' :
                    'En attente de la prochaine question...'
            }
        </div>
    );
});

QuestionDisplay.displayName = 'QuestionDisplay';

export default QuestionDisplay;
