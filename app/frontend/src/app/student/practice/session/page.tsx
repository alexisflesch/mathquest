/**
 * Student Practice Session Page
 * 
 * This page provides the interactive question interface for student practice sessions:
 * - Uses socket-based practice mode with the new backend system
 * - Presents questions one at a time with multiple choice answers
 * - Provides immediate feedback on answers with explanations
 * - Tracks student score with manual progression through questions
 * - Provides a summary and score report upon completion
 * 
 * Updated to use usePracticeGameSocket hook for real-time socket communication
 * with the backend practice mode system, replacing the old API-based approach.
 */

"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MathJaxWrapper from '@/components/MathJaxWrapper';
import QuestionCard from '@/components/QuestionCard';
import { QUESTION_TYPES } from '@shared/types';
import { usePracticeGameSocket } from '@/hooks/usePracticeGameSocket';
import { Answer } from '@shared/types/question';

export default function PracticeSessionPage() {
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);

    // Get practice parameters from URL
    const [practiceParams, setPracticeParams] = useState({
        discipline: '',
        level: '',
        themes: [] as string[],
        limit: 10
    });

    // Mock user data - in real app this would come from auth context
    const [userId] = useState('practice-user-123');
    const [username] = useState('Practice User');

    // Initialize practice socket hook
    const {
        gameState,
        connected,
        connecting,
        error,
        startPracticeSession,
        submitAnswer,
        requestNextQuestion,
        clearFeedback
    } = usePracticeGameSocket({
        discipline: practiceParams.discipline,
        level: practiceParams.level,
        themes: practiceParams.themes,
        questionLimit: practiceParams.limit,
        userId,
        username
    });

    // UI state for answer selection
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsMobile(window.innerWidth < 768);
        }
    }, []);

    // Extract practice parameters from URL on component mount
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const discipline = searchParams.get("discipline") || "";
        const level = searchParams.get("level") || "";
        const themesParam = searchParams.get("themes") || "";
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        const themes = themesParam ? themesParam.split(',').filter(t => t.trim()) : [];

        setPracticeParams({
            discipline,
            level,
            themes,
            limit
        });
    }, []);

    // Start practice session when parameters are loaded and socket is connected
    useEffect(() => {
        if (connected && practiceParams.discipline && !gameState.connectedToRoom) {
            startPracticeSession();
        }
    }, [connected, practiceParams, gameState.connectedToRoom, startPracticeSession]);

    // Reset answer selection when question changes
    useEffect(() => {
        setSelectedAnswer(null);
        setSelectedAnswers([]);
    }, [gameState.currentQuestion?.uid]);

    const isMultipleChoice = gameState.currentQuestion?.questionType === QUESTION_TYPES.MULTIPLE_CHOICE;

    const handleSingleChoice = (idx: number) => {
        if (gameState.answered) return; // Prevent changes after answering

        setSelectedAnswer(idx === selectedAnswer ? null : idx);

        // Auto-submit for single choice
        if (gameState.currentQuestion && idx !== selectedAnswer) {
            const answer = idx;
            // Practice mode: No timer, use a simple time tracking or 0
            const timeSpent = 0; // Practice mode doesn't track time strictly

            submitAnswer(gameState.currentQuestion.uid, answer, timeSpent);
        }
    };

    const handleSubmitMultiple = () => {
        if (gameState.answered || selectedAnswers.length === 0 || !gameState.currentQuestion) return;

        // Practice mode: No timer, use simple time tracking
        const timeSpent = 0; // Practice mode doesn't track time strictly

        submitAnswer(gameState.currentQuestion.uid, selectedAnswers, timeSpent);
    };

    const handleNextQuestion = () => {
        if (!gameState.currentQuestion) return;

        clearFeedback();
        requestNextQuestion(gameState.currentQuestion.uid);
    };

    // Loading states
    if (connecting) {
        return (
            <div className="main-content">
                <div className="card w-full max-w-2xl bg-base-100 rounded-lg shadow-xl my-6">
                    <div className="card-body items-center justify-center min-h-[300px]">
                        <div className="text-xl font-bold">Connexion en cours…</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="main-content">
                <div className="card w-full max-w-2xl bg-base-100 rounded-lg shadow-xl my-6">
                    <div className="card-body items-center justify-center min-h-[300px]">
                        <div className="text-xl font-bold text-error">Erreur: {error}</div>
                        <button
                            className="btn btn-primary mt-4"
                            onClick={() => router.push("/student/create-game/?training=true")}
                        >
                            Retour
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!connected) {
        return (
            <div className="main-content">
                <div className="card w-full max-w-2xl bg-base-100 rounded-lg shadow-xl my-6">
                    <div className="card-body items-center justify-center min-h-[300px]">
                        <div className="text-xl font-bold">Chargement…</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content">
            <div className="card w-full max-w-2xl bg-base-100 rounded-lg shadow-xl my-6">
                <MathJaxWrapper>
                    {gameState.gameStatus !== 'finished' && gameState.currentQuestion && (
                        <>
                            <QuestionCard
                                currentQuestion={{
                                    question: {
                                        uid: gameState.currentQuestion.uid,
                                        text: gameState.currentQuestion.text,
                                        questionType: gameState.currentQuestion.questionType,
                                        answerOptions: gameState.currentQuestion.answerOptions || []
                                    }
                                }}
                                questionIndex={gameState.questionIndex}
                                totalQuestions={gameState.totalQuestions}
                                isMultipleChoice={isMultipleChoice}
                                selectedAnswer={selectedAnswer}
                                setSelectedAnswer={setSelectedAnswer}
                                selectedAnswers={selectedAnswers}
                                setSelectedAnswers={setSelectedAnswers}
                                handleSingleChoice={handleSingleChoice}
                                handleSubmitMultiple={handleSubmitMultiple}
                                answered={gameState.answered}
                                isQuizMode={false}
                            />

                            {/* Enhanced Feedback Section */}
                            {gameState.feedback && (
                                <div className="card-body">
                                    <div className={`alert ${gameState.feedback.correct ? 'alert-success' : 'alert-error'}`}>
                                        <div>
                                            <h4 className="font-bold">
                                                {gameState.feedback.correct ? '✅ Bonne réponse!' : '❌ Mauvaise réponse'}
                                            </h4>

                                            {/* Show correct answers if available */}
                                            {gameState.feedback.correctAnswers && gameState.currentQuestion?.answerOptions && (
                                                <div className="mt-3">
                                                    <p className="font-semibold">Bonnes réponses:</p>
                                                    <ul className="list-disc list-inside ml-4">
                                                        {gameState.feedback.correctAnswers.map((isCorrect, index) => {
                                                            if (isCorrect && gameState.currentQuestion?.answerOptions[index]) {
                                                                const answerText = gameState.currentQuestion.answerOptions[index];
                                                                return (
                                                                    <li key={index} className="text-green-700">
                                                                        {answerText}
                                                                    </li>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Explanation */}
                                            {gameState.feedback.explanation && (
                                                <div className="mt-3">
                                                    <p className="font-semibold">Explication:</p>
                                                    <p className="mt-1">{gameState.feedback.explanation}</p>
                                                </div>
                                            )}

                                            {/* Score awarded */}
                                            {gameState.feedback.scoreAwarded && (
                                                <p className="mt-2">
                                                    Points gagnés: {gameState.feedback.scoreAwarded}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Next Question Button */}
                                    {gameState.questionIndex < gameState.totalQuestions - 1 ? (
                                        <button
                                            className="btn btn-primary mt-4"
                                            onClick={handleNextQuestion}
                                        >
                                            Question suivante
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-success mt-4"
                                            onClick={handleNextQuestion}
                                        >
                                            Terminer l'entraînement
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Multiple Choice Submit Button */}
                            {isMultipleChoice && !gameState.answered && (
                                <div className="card-body pt-0">
                                    <button
                                        className="btn btn-primary w-full"
                                        onClick={handleSubmitMultiple}
                                        disabled={selectedAnswers.length === 0}
                                    >
                                        Valider la réponse
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </MathJaxWrapper>

                {/* Practice Complete */}
                {gameState.gameStatus === 'finished' && (
                    <div className="w-full flex flex-col items-center gap-4 text-center p-8">
                        <h3 className="card-title text-2xl mb-2">Entraînement terminé !</h3>
                        <div className="text-2xl mb-2 font-extrabold">
                            Score : {gameState.score} / {gameState.totalQuestions}
                        </div>
                        <div className="stats shadow">
                            <div className="stat">
                                <div className="stat-title">Questions répondues</div>
                                <div className="stat-value">{gameState.questionIndex + 1}</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Score total</div>
                                <div className="stat-value">{gameState.score}</div>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary btn-lg mt-4"
                            onClick={() => router.push("/student/create-game/?training=true")}
                        >
                            Nouvel entraînement
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
