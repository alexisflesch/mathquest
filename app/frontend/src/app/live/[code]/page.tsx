/**
 * Live Game Page - Handles Tournament, Quiz, and Self-Paced Modes
 * 
 * This unified page handles all three game modes that can be accessed via /live/[code]:
 * 1. Tournament Mode (live/differed): Real-time competition with backend timing
 * 2. Quiz Mode: Teacher-controlled quiz sessions with feedback
 * 3. Self-Paced Mode: Individual practice with immediate feedback
 * 
 * Mode detection is performed by checking the tournament's linkedQuizId and gameState properties.
 */

"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from '@/components/AuthProvider';
import Snackbar from '@/components/Snackbar';
import { createLogger } from '@/clientLogger';
import MathJaxWrapper from '@/components/MathJaxWrapper';
import TournamentTimer from '@/components/TournamentTimer';
import QuestionCard from '@/components/QuestionCard';
import type { TournamentQuestion } from '@shared/types';
import AnswerFeedbackOverlay from '@/components/AnswerFeedbackOverlay';
import { makeApiRequest } from '@/config/api';
import { useStudentGameSocket } from '@/hooks/migrations';
import { FilteredQuestion } from '@shared/types/quiz/liveQuestion';
import InfinitySpin from '@/components/InfinitySpin';

// Create a logger for this component
const logger = createLogger('LiveGamePage');

export default function LiveGamePage() {
    const { code } = useParams();
    const router = useRouter();
    const { userState, userProfile, isLoading } = useAuth();

    // Detect differed mode from URL
    const [isDiffered, setIsDiffered] = useState(false);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            setIsDiffered(params.get('differed') === '1');
        }
    }, []);

    // Authentication guard - redirect if user is not properly authenticated
    useEffect(() => {
        if (isLoading) {
            // Still checking authentication, wait
            return;
        }

        if (userState === 'anonymous') {
            logger.warn('User is anonymous, redirecting to home page');
            router.push('/');
            return;
        }

        if (!userProfile.username || !userProfile.avatar) {
            logger.warn('User profile incomplete, redirecting to home page', { userProfile });
            router.push('/');
            return;
        }

        logger.info('User authentication verified for live game', { userState, userProfile });
    }, [isLoading, userState, userProfile, router]);

    // Show loading while authentication is being checked
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <InfinitySpin size={48} />
                    <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated
    if (userState === 'anonymous' || !userProfile.username || !userProfile.avatar) {
        return null;
    }

    // Get user data from AuthProvider
    const userId = userProfile.userId || userProfile.cookieId || `temp_${Date.now()}`;
    const username = userProfile.username;
    const avatarEmoji = userProfile.avatar;

    // Enhanced socket hook integration
    const {
        socket,
        gameState,
        connected,
        connecting,
        error: socketError,
        joinGame,
        submitAnswer,
        requestNextQuestion
    } = useStudentGameSocket({
        accessCode: typeof code === 'string' ? code : null,
        userId,
        username,
        avatarEmoji,
        isDiffered
    });

    // Local UI state
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>("");
    const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");
    const [isMobile, setIsMobile] = useState(false);

    // Feedback system state
    const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
    const [feedbackText, setFeedbackText] = useState<string>("");
    const [feedbackDuration, setFeedbackDuration] = useState<number>(0);

    // Handle responsive design
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        handleResize(); // Set initial value
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Check tournament status on mount
    useEffect(() => {
        async function checkTournamentStatus() {
            try {
                const status = await makeApiRequest<{
                    status: string;
                    statut?: string;
                }>(`games/${code}/state`);

                if (status.status === 'finished' || status.statut === 'terminé') {
                    logger.info(`Tournament ${code} is finished, redirecting to leaderboard`);
                    router.replace(`/leaderboard/${code}`);
                } else if (status.status === 'preparing' || status.statut === 'en préparation') {
                    logger.info(`Tournament ${code} is still in preparation, redirecting to lobby`);
                    router.replace(`/lobby/${code}`);
                }
            } catch (err) {
                logger.error(`Error checking tournament status: ${err}`);
            }
        }

        // Only check tournament status if user is authenticated
        if (userProfile.username) {
            checkTournamentStatus();
        }
    }, [code, router, userState, userProfile.username]);

    // Automatically join the game when user data is ready
    useEffect(() => {
        if (userId && username && typeof code === 'string' && !connected && !connecting) {
            logger.info('Joining game with enhanced socket hook');
            joinGame();
        }
    }, [userId, username, code, connected, connecting, joinGame]);

    // Enhanced feedback handling for all modes
    useEffect(() => {
        // Handle practice mode feedback with immediate answer received events
        if (gameMode === 'practice' && gameState.lastAnswerFeedback) {
            const feedback = gameState.lastAnswerFeedback;
            if (feedback.explanation) {
                setFeedbackText(feedback.explanation);
                setFeedbackDuration(10); // Longer duration for practice mode
                setShowFeedbackOverlay(true);

                logger.info(`Showing practice mode feedback overlay`);
            }
        }
        // Handle feedback phase in tournament/quiz modes
        else if (gameState.phase === 'feedback' && gameState.feedbackRemaining !== null) {
            // Get explanation from current question
            let explanation: string | undefined;

            if (gameState.currentQuestion?.explanation) {
                explanation = gameState.currentQuestion.explanation;
            }

            if (explanation) {
                setFeedbackText(explanation);
                setFeedbackDuration(gameState.feedbackRemaining);
                setShowFeedbackOverlay(true);

                logger.info(`Showing feedback overlay for ${gameState.feedbackRemaining}s`);

                // Auto-hide feedback overlay when time expires
                const timer = setTimeout(() => {
                    setShowFeedbackOverlay(false);
                }, gameState.feedbackRemaining * 1000);

                return () => clearTimeout(timer);
            }
        }
        // Hide feedback overlay when new question starts
        else if (gameState.phase === 'question') {
            setShowFeedbackOverlay(false);
            setFeedbackText("");
        }
    }, [gameState.phase, gameState.feedbackRemaining, gameState.currentQuestion, gameState.gameMode, gameState.lastAnswerFeedback, gameState.correctAnswers]);

    // Handle socket errors
    useEffect(() => {
        if (socketError) {
            setSnackbarType("error");
            setSnackbarMessage(socketError);
            setSnackbarOpen(true);
        }
    }, [socketError]);

    // Reset selected answers when question changes
    const currentQuestionId = gameState.currentQuestion?.uid;
    useEffect(() => {
        setSelectedAnswer(null);
        setSelectedAnswers([]);
        setSnackbarOpen(false);
        setShowFeedbackOverlay(false); // Hide feedback when question changes
    }, [currentQuestionId]);

    // Determine game mode for display
    const gameMode = useMemo(() => {
        // Practice mode: differed=true and typically no linkedQuizId
        if (isDiffered && !gameState.linkedQuizId) {
            return 'practice';
        }
        // Quiz mode: has linkedQuizId (teacher-controlled)
        else if (gameState.linkedQuizId) {
            return 'quiz';
        }
        // Tournament mode: live competition
        else {
            return 'tournament';
        }
    }, [isDiffered, gameState.linkedQuizId]);

    // Helper: is multiple choice
    const isMultipleChoice = useMemo(() => {
        return gameState.currentQuestion?.type === "choix_multiple";
    }, [gameState.currentQuestion]);

    // Handle single choice answer submission
    const handleSingleChoice = (idx: number) => {
        if (gameState.gameStatus !== 'active' || gameState.answered) return;

        setSelectedAnswer(idx === selectedAnswer ? null : idx);

        if (!gameState.currentQuestion) return;

        const clientTimestamp = Date.now();
        logger.debug('Submitting single choice answer', {
            questionId: gameState.currentQuestion.uid,
            answer: idx,
            clientTimestamp,
            gameMode
        });

        submitAnswer(gameState.currentQuestion.uid, idx, clientTimestamp);
    };

    // Handle multiple choice answer submission
    const handleSubmitMultiple = () => {
        if (gameState.gameStatus !== 'active' || gameState.answered || selectedAnswers.length === 0) {
            if (selectedAnswers.length === 0) {
                setSnackbarMessage("Veuillez sélectionner au moins une réponse.");
                setSnackbarType("error");
                setSnackbarOpen(true);
            }
            return;
        }

        if (!gameState.currentQuestion) return;

        const clientTimestamp = Date.now();
        logger.debug('Submitting multiple choice answers', {
            questionId: gameState.currentQuestion.uid,
            answers: selectedAnswers,
            clientTimestamp,
            gameMode
        });

        submitAnswer(gameState.currentQuestion.uid, selectedAnswers, clientTimestamp);
    };

    // Handle next question request (for practice mode)
    const handleRequestNextQuestion = () => {
        if (gameMode === 'practice' && gameState.currentQuestion) {
            logger.debug('Requesting next question in practice mode');
            requestNextQuestion(gameState.currentQuestion.uid);
        }
    };

    // Convert enhanced socket hook state to legacy QuestionCard format
    const currentQuestion: TournamentQuestion | null = useMemo(() => {
        if (!gameState.currentQuestion) return null;

        // Convert StudentGameQuestion to the format expected by TournamentQuestionCard
        const convertedQuestion: FilteredQuestion = {
            uid: gameState.currentQuestion.uid,
            text: gameState.currentQuestion.text,
            type: gameState.currentQuestion.type || gameState.currentQuestion.questionType || 'multiple_choice',
            answers: gameState.currentQuestion.answers || gameState.currentQuestion.answerOptions || []
        };

        return {
            code: typeof code === 'string' ? code : '',
            question: convertedQuestion,
            timer: gameState.timer !== null ? gameState.timer : undefined,
            questionIndex: gameState.questionIndex,
            totalQuestions: gameState.totalQuestions,
            questionState: gameState.gameStatus === 'paused' ? 'paused' :
                gameState.gameStatus === 'active' ? 'active' : 'stopped',
            tournoiState: 'running'
        };
    }, [gameState, code]);

    // Determine if component should be readonly (showing answers)
    const isReadonly = useMemo(() => {
        return gameState.phase === 'show_answers' ||
            gameState.gameStatus === 'finished' ||
            (gameState.answered && gameMode === 'practice');
    }, [gameState.phase, gameState.gameStatus, gameState.answered, gameMode]);

    return (
        <div className="main-content">
            {/* Enhanced Feedback Overlay */}
            {showFeedbackOverlay && (
                <div className="feedback-overlay">
                    <AnswerFeedbackOverlay
                        explanation={feedbackText}
                        duration={feedbackDuration}
                        onClose={() => setShowFeedbackOverlay(false)}
                        isCorrect={gameState.lastAnswerFeedback?.correct}
                        correctAnswers={gameState.currentQuestion?.correctAnswers ?
                            gameState.currentQuestion.answers?.map((_, index) =>
                                gameState.currentQuestion?.correctAnswers?.includes(index) || false
                            ) : undefined
                        }
                        answerOptions={gameState.currentQuestion?.answers || gameState.currentQuestion?.answerOptions}
                        showTimer={gameMode !== 'practice'} // Hide timer for practice mode
                        mode={gameMode}
                        allowManualClose={gameMode === 'practice'}
                    />
                </div>
            )}

            {/* Main Question Card */}
            <div className={`card w-full max-w-2xl bg-base-100 rounded-lg shadow-xl my-6 relative${showFeedbackOverlay ? " blur-sm" : ""}`}>
                {/* Show timer only for tournament/quiz modes */}
                {gameMode !== 'practice' && (
                    <TournamentTimer timer={gameState.timer} isMobile={isMobile} />
                )}

                <MathJaxWrapper>
                    {currentQuestion ? (
                        <QuestionCard
                            currentQuestion={currentQuestion}
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
                            isQuizMode={gameMode === 'quiz'}
                            correctAnswers={gameState.correctAnswers || []}
                            readonly={isReadonly}
                        />
                    ) : (
                        <div className="text-center text-lg text-gray-500 p-8">
                            {connecting ? 'Connexion...' :
                                !connected ? 'Connexion en cours...' :
                                    'En attente de la prochaine question...'}
                        </div>
                    )}
                </MathJaxWrapper>

                {/* Enhanced practice mode progression */}
                {gameMode === 'practice' && gameState.answered && !showFeedbackOverlay && (
                    <div className="p-4 text-center">
                        <div className="space-y-2">
                            <div className="text-sm text-gray-600">
                                Question {gameState.questionIndex + 1} sur {gameState.totalQuestions} terminée
                            </div>
                            {gameState.questionIndex < gameState.totalQuestions - 1 ? (
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={handleRequestNextQuestion}
                                    disabled={!gameState.currentQuestion}
                                >
                                    Question suivante →
                                </button>
                            ) : (
                                <button
                                    className="btn btn-success btn-lg"
                                    onClick={handleRequestNextQuestion}
                                    disabled={!gameState.currentQuestion}
                                >
                                    Terminer l'entraînement ✓
                                </button>
                            )}

                            {/* Show explanation again if available */}
                            {gameState.lastAnswerFeedback?.explanation && (
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setShowFeedbackOverlay(true)}
                                >
                                    Revoir l'explication
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Mode indicator (for debugging) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 left-4 bg-gray-800 text-white px-2 py-1 rounded text-xs">
                    Mode: {gameMode} | Phase: {gameState.phase} | Status: {gameState.gameStatus}
                </div>
            )}

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                message={snackbarMessage}
                type={snackbarType}
                onClose={() => setSnackbarOpen(false)}
                className={showFeedbackOverlay ? "blur-sm" : ""}
            />
        </div>
    );
}