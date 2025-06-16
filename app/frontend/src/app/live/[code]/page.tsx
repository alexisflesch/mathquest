/**
 * Live Game Page - Handles Tournament, Quiz, and Self-Paced Modes
 * 
 * This unified page handles all three game modes that can be accessed via /live/[code]:
        if (gameState.gameStatus === 'finished' && code) {
            logger.info(`Game finished, redirecting to leaderboard in 3 seconds`);
            const timer = setTimeout(() => {
                logger.info(`Redirecting to leaderboard: /leaderboard/${code}`);
                router.push(`/leaderboard/${code}`);
            }, 3000); // Give user time to see final results
            return () => clearTimeout(timer);
        }rnament Mode (live/differed): Real-time competition with backend timing
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
import { useStudentGameSocket } from '@/hooks/useStudentGameSocket';
import { FilteredQuestion } from '@shared/types/quiz/liveQuestion';
import InfinitySpin from '@/components/InfinitySpin';
import { QUESTION_TYPES } from '@shared/types';

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
        isDiffered,
        onAnswerReceived: () => {
            setSnackbarType("success");
            setSnackbarMessage("Réponse enregistrée");
            setSnackbarOpen(true);
        }
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

    // NOTE: Removed autonomous tournament status checking and redirecting
    // The frontend should NOT make autonomous decisions about redirecting
    // It should wait for backend signals via socket events like 'tournament_finished_redirect'

    // Automatically join the game when user data is ready
    useEffect(() => {
        if (userId && username && typeof code === 'string' && !connected && !connecting) {
            logger.info('Joining game with enhanced socket hook');
            joinGame();
        }
    }, [userId, username, code, connected, connecting, joinGame]);

    // Handle game end - Wait for backend signaling, do NOT redirect automatically
    // The backend should emit 'tournament_finished_redirect' or similar event
    // Removed automatic redirect to respect backend control
    useEffect(() => {
        if (gameState.gameStatus === 'completed' && code) {
            logger.info(`Game finished - waiting for backend redirect signal`);
            // Do NOT redirect automatically - wait for backend event
        }
        return () => { }; // Return empty cleanup function for other cases
    }, [gameState.gameStatus, router, code]);

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
        else if (gameState.phase === 'feedback' && gameState.feedbackRemaining !== null && !showFeedbackOverlay) {
            // Only show overlay if it's not already showing (prevent re-rendering every second)

            // Priority 1: Use explanation from lastAnswerFeedback (comes from backend feedback event)
            // Priority 2: Generate message based on correctness
            // Priority 3: Fallback messages
            // NOTE: Do NOT use currentQuestion.explanation autonomously - wait for backend feedback event
            let feedbackMessage: string | undefined;

            if (gameState.lastAnswerFeedback?.explanation) {
                feedbackMessage = gameState.lastAnswerFeedback.explanation;
            } else if (gameState.lastAnswerFeedback?.correct !== undefined) {
                // Generate message based on correctness if no explanation available
                feedbackMessage = gameState.lastAnswerFeedback.correct
                    ? "Bonne réponse ! ✅"
                    : "Mauvaise réponse ❌";
            } else {
                // Default fallback when in feedback phase but no explanation available
                feedbackMessage = "Réponse enregistrée"; // Answer recorded
            }

            setFeedbackText(feedbackMessage || "");
            setFeedbackDuration(gameState.feedbackRemaining);
            setShowFeedbackOverlay(true);

            logger.info(`Showing feedback overlay for ${gameState.feedbackRemaining}s`, {
                hasExplanation: !!(gameState.lastAnswerFeedback?.explanation),
                feedbackMessage,
                lastAnswerCorrect: gameState.lastAnswerFeedback?.correct,
                explanationSource: gameState.lastAnswerFeedback?.explanation ? 'feedback' : 'generated'
            });

            // NOTE: Do NOT auto-hide feedback overlay - let backend control when to close it
            // The backend will send the next phase/question when feedback time is over
        }
        // Hide feedback overlay when new question starts
        else if (gameState.phase === 'question') {
            setShowFeedbackOverlay(false); // Close feedback when new question starts
            setFeedbackText("");
        }

        // Return empty cleanup function for consistency
        return () => { };
    }, [gameState.phase, gameState.feedbackRemaining, gameState.gameMode, gameState.lastAnswerFeedback, gameState.correctAnswers]);

    // Handle socket errors
    useEffect(() => {
        if (socketError) {
            setSnackbarType("error");
            setSnackbarMessage(socketError);
            setSnackbarOpen(true);
        }
    }, [socketError]);

    // Reset selected answers when question changes
    const currentQuestionUid = gameState.currentQuestion?.uid;
    useEffect(() => {
        setSelectedAnswer(null);
        setSelectedAnswers([]);
        setSnackbarOpen(false);
        setShowFeedbackOverlay(false); // Hide feedback when question changes
    }, [currentQuestionUid]);

    // Get game mode directly from game state (now mandatory) and map to component mode
    const gameMode = useMemo(() => {
        const playMode = gameState.gameMode;
        // Map PlayMode to component-expected mode types
        switch (playMode) {
            case 'practice':
                return 'practice';
            case 'quiz':
            case 'class': // Map class mode to quiz for component compatibility
                return 'quiz';
            case 'tournament':
            default:
                return 'tournament';
        }
    }, [gameState.gameMode]);

    // Helper: is multiple choice
    const isMultipleChoice = useMemo(() => {
        return gameState.currentQuestion?.questionType === "choix_multiple";
    }, [gameState.currentQuestion?.questionType]);

    // Handle single choice answer submission
    const handleSingleChoice = (idx: number) => {
        if (gameState.gameStatus !== 'active') return;

        setSelectedAnswer(idx === selectedAnswer ? null : idx);

        if (!gameState.currentQuestion) return;

        const clientTimestamp = Date.now();
        logger.debug('Submitting single choice answer', {
            questionUid: gameState.currentQuestion.uid,
            answer: idx,
            clientTimestamp,
            gameMode
        });

        submitAnswer(gameState.currentQuestion.uid, idx, clientTimestamp);
    };

    // Handle multiple choice answer submission
    const handleSubmitMultiple = () => {
        if (gameState.gameStatus !== 'active' || selectedAnswers.length === 0) {
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
            questionUid: gameState.currentQuestion.uid,
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

    // Debug timer value (development only)
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            logger.debug('Timer debug:', {
                gameStateTimer: gameState.timer,
                gameMode,
                isTimerShown: gameMode !== 'practice'
            });
        }
    }, [gameState.timer, gameMode]);

    // Convert enhanced socket hook state to legacy QuestionCard format
    const currentQuestion: TournamentQuestion | null = useMemo(() => {
        if (!gameState.currentQuestion) return null;

        // Convert StudentGameQuestion to the format expected by TournamentQuestionCard
        const convertedQuestion: FilteredQuestion = {
            uid: gameState.currentQuestion.uid,
            text: gameState.currentQuestion.text,
            questionType: gameState.currentQuestion.questionType || QUESTION_TYPES.MULTIPLE_CHOICE_EN,
            answerOptions: gameState.currentQuestion.answerOptions || []
        };

        return {
            code: typeof code === 'string' ? code : '',
            question: convertedQuestion,
            remainingTime: gameState.timer?.timeLeftMs ? Math.ceil(gameState.timer.timeLeftMs / 1000) : undefined,
            questionIndex: gameState.questionIndex,
            totalQuestions: gameState.totalQuestions,
            questionState: gameState.gameStatus === 'paused' ? 'paused' :
                gameState.gameStatus === 'active' ? 'active' : 'stopped',
            tournoiState: 'running'
        };
    }, [gameState, code]);    // Determine if component should be readonly (showing answers)
    const isReadonly = useMemo(() => {
        return gameState.phase === 'show_answers' ||
            gameState.gameStatus === 'completed' ||
            (gameState.answered && gameMode === 'practice');
    }, [gameState.phase, gameState.gameStatus, gameState.answered, gameMode]);

    // Auto-hide snackbar after 2 seconds
    useEffect(() => {
        if (snackbarOpen) {
            const timer = setTimeout(() => {
                setSnackbarOpen(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
        return () => { }; // Return empty cleanup function when snackbar is not open
    }, [snackbarOpen]);

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
                            (gameState.currentQuestion.answerOptions || [])?.map((_: string, index: number) =>
                                gameState.currentQuestion?.correctAnswers?.[index] || false
                            ) : undefined
                        }
                        answerOptions={gameState.currentQuestion?.answerOptions}
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
                    <TournamentTimer timerS={gameState.timer?.timeLeftMs ? Math.ceil(gameState.timer.timeLeftMs / 1000) : null} isMobile={isMobile} />
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
                            {gameState.gameStatus === 'completed' ?
                                <>
                                    <div className="text-2xl mb-4">🎉 Jeu terminé !</div>
                                    <div>Redirection vers le classement...</div>
                                </> :
                                connecting ? 'Connexion...' :
                                    !connected ? 'Connexion en cours...' :
                                        'En attente de la prochaine question...'
                            }
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

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                message={snackbarMessage}
                type={snackbarType}
                onClose={() => setSnackbarOpen(false)}
                className={showFeedbackOverlay ? "blur-sm" : ""}
            />

            {/* Answer Feedback Overlay */}
            {showFeedbackOverlay && (
                <AnswerFeedbackOverlay
                    explanation={feedbackText}
                    duration={feedbackDuration}
                    onClose={() => setShowFeedbackOverlay(false)}
                    isCorrect={gameState.lastAnswerFeedback?.correct}
                    allowManualClose={gameMode === 'practice'}
                    mode={gameMode}
                />
            )}
        </div>
    );
}