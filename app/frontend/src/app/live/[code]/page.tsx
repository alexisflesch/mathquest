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
import QrCodeWithLogo from '@/components/QrCodeWithLogo';
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from '@/components/AuthProvider';
import Snackbar from '@/components/Snackbar';
import { createLogger } from '@/clientLogger';
import MathJaxWrapper from '@/components/MathJaxWrapper';
import TournamentTimer from '@/components/TournamentTimer';
import QuestionCard from '@/components/QuestionCard';
import LeaderboardModal from '@/components/LeaderboardModal';
import InfoModal from '@/components/SharedModal';
import type { QuestionData } from '@shared/types/socketEvents';
import AnswerFeedbackOverlay from '@/components/AnswerFeedbackOverlay';
import { makeApiRequest } from '@/config/api';
import { useStudentGameSocket } from '@/hooks/useStudentGameSocket';
import { useSimpleTimer } from '@/hooks/useSimpleTimer';
import type { z } from 'zod';
import { questionDataForStudentSchema } from '@shared/types/socketEvents.zod';
type QuestionDataForStudent = z.infer<typeof questionDataForStudentSchema>;
import InfinitySpin from '@/components/InfinitySpin';
import { QUESTION_TYPES } from '@shared/types';
import { SOCKET_EVENTS, TOURNAMENT_EVENTS } from '@shared/types/socket/events';
import { Trophy, Share2, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { LeaderboardEntry } from '@shared/types/core/leaderboardEntry.zod';
import type { GameParticipant } from '@shared/types/core/participant';
import type { LobbyParticipantListPayload, LobbyParticipant } from '@shared/types/lobbyParticipantListPayload';
import LobbyLayout from '@/components/LobbyLayout';

// Create a logger for this component
const logger = createLogger('LiveGamePage');

// Stable empty objects to prevent unnecessary re-renders
const EMPTY_LEADERBOARD: any[] = [];

// Memoized Timer Display Component
const TimerDisplay = React.memo(({
    gameMode,
    timerState,
    isMobile
}: {
    gameMode: string;
    timerState: any;
    isMobile: boolean;
}) => {
    // Re-render logging for TimerDisplay
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());

    useEffect(() => {
        renderCount.current++;
        const now = Date.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;

        logger.info(`🔄 [TIMER-RERENDER] TimerDisplay re-render #${renderCount.current} (${timeSinceLastRender}ms since last)`);
    });

    if (gameMode === 'practice') return null;

    const timerSeconds = timerState?.timeLeftMs ? Math.floor(timerState.timeLeftMs / 1000) : null;
    return <TournamentTimer timerS={timerSeconds} isMobile={isMobile} />;
});
TimerDisplay.displayName = 'TimerDisplay';

// Memoized Leaderboard FAB Component (Mobile: right side, Desktop: top left)
const LeaderboardFAB = React.memo(({
    isMobile,
    userId,
    leaderboardLength,
    userRank,
    onOpen
}: {
    isMobile: boolean;
    userId: string | null;
    leaderboardLength: number;
    userRank: number | null;
    onOpen: () => void;
}) => {
    // Re-render logging for LeaderboardFAB
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());

    useEffect(() => {
        renderCount.current++;
        const now = Date.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;

        logger.info(`🔄 [FAB-RERENDER] LeaderboardFAB re-render #${renderCount.current} (${timeSinceLastRender}ms since last)`);
    });

    if (!userId || leaderboardLength === 0 || !userRank) {
        return null;
    }

    // Mobile positioning (right side, fixed to viewport)
    const mobileClasses = "fixed right-4 z-[150] flex items-center space-x-2 px-3 py-2 bg-transparent text-[var(--success)] rounded-full hover:bg-white/10 transition-all duration-200";
    const mobileStyle = {
        zIndex: 150,
        top: 'calc(var(--navbar-height) / 2)',
        transform: 'translateY(-50%)'
    };

    // Desktop positioning (relative to main-content, absolute inside)
    const desktopClasses = "absolute left-4 top-4 z-[150] flex items-center space-x-2 px-4 py-2 bg-[var(--navbar)] backdrop-blur-sm text-[var(--success)] rounded-full transition-all duration-200 shadow-lg";
    const desktopStyle = {
        zIndex: 150,
    };

    return (
        <button
            onClick={onOpen}
            className={isMobile ? mobileClasses : desktopClasses}
            style={isMobile ? mobileStyle : desktopStyle}
            aria-label="Voir le classement complet"
        >
            <motion.div
                animate={{
                    scale: [1, 1.3, 1.2, 1.3, 1],
                    rotate: [0, -8, 8, -8, 8, -8, 0],
                }}
                transition={{
                    duration: 0.6,
                    ease: "easeInOut",
                    times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                    repeat: 1,
                }}
            >
                <Trophy className="w-5 h-5" />
            </motion.div>
            <span className="text-md font-bold">
                #{userRank}
            </span>
        </button>
    );
});
LeaderboardFAB.displayName = 'LeaderboardFAB';

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
}: {
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
}) => {
    // Re-render logging for QuestionDisplay
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());

    useEffect(() => {
        renderCount.current++;
        const now = Date.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;

        logger.info(`🔄 [QUESTION-RERENDER] QuestionDisplay re-render #${renderCount.current} (${timeSinceLastRender}ms since last)`);
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

// Memoized Practice Mode Progression Component
const PracticeModeProgression = React.memo(({
    gameMode,
    answered,
    showFeedbackOverlay,
    questionIndex,
    totalQuestions,
    handleRequestNextQuestion,
    hasExplanation,
    onReopenFeedback,
    currentQuestion
}: {
    gameMode: string;
    answered: boolean;
    showFeedbackOverlay: boolean;
    questionIndex: number;
    totalQuestions: number;
    handleRequestNextQuestion: () => void;
    hasExplanation: boolean;
    onReopenFeedback: () => void;
    currentQuestion: any;
}) => {
    // Re-render logging for PracticeModeProgression
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());

    useEffect(() => {
        renderCount.current++;
        const now = Date.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;

        logger.info(`🔄 [PRACTICE-RERENDER] PracticeModeProgression re-render #${renderCount.current} (${timeSinceLastRender}ms since last)`);
    });

    if (gameMode !== 'practice' || !answered || showFeedbackOverlay) {
        return null;
    }

    return (
        <div className="p-4 text-center">
            <div className="space-y-2">
                <div className="text-sm text-gray-600">
                    Question {questionIndex + 1} sur {totalQuestions} terminée
                </div>
                {questionIndex < totalQuestions - 1 ? (
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleRequestNextQuestion}
                        disabled={!currentQuestion}
                    >
                        Question suivante →
                    </button>
                ) : (
                    <button
                        className="btn btn-success btn-lg"
                        onClick={handleRequestNextQuestion}
                        disabled={!currentQuestion}
                    >
                        Terminer l'entraînement ✓
                    </button>
                )}

                {/* Show explanation again if available */}
                {hasExplanation && (
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={onReopenFeedback}
                    >
                        Revoir l'explication
                    </button>
                )}
            </div>
        </div>
    );
});
PracticeModeProgression.displayName = 'PracticeModeProgression';

// Modern unified participant payload
interface UnifiedParticipantListPayload {
    participants: GameParticipant[];
    creator: GameParticipant;
}

// Unified participant state for lobby display
interface LobbyUIState {
    participants: GameParticipant[];
    creator: GameParticipant | null;
    countdown: number | null;
}


export default function LiveGamePage() {

    // Re-render logging for performance monitoring
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());

    useEffect(() => {
        renderCount.current++;
        const now = Date.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;

        logger.info(`🔄 [LIVE-RERENDER] Component re-render #${renderCount.current} (${timeSinceLastRender}ms since last)`);
    });

    const { code } = useParams();
    const router = useRouter();
    const { userState, userProfile, isLoading } = useAuth();

    // Get user data from AuthProvider
    const userId = userProfile.userId || userProfile.cookieId || `temp_${Date.now()}`;
    const username: string | null = userProfile.username ?? null;
    const avatarEmoji = userProfile.avatar;

    // 🐛 DEBUG: Track userProfile state to identify username vs cookieId issues
    useEffect(() => {
        logger.info('🐛 [USER_PROFILE_DEBUG] UserProfile state in live page', {
            userProfile,
            userId,
            username,
            avatarEmoji,
            cookieId: userProfile.cookieId,
            marker: '[LIVE_PAGE_USER_DEBUG]'
        });
    }, [userProfile, userId, username, avatarEmoji]);

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
        onAnswerReceived: () => {
            setSnackbarType("success");
            setSnackbarMessage("Réponse enregistrée");
            setSnackbarOpen(true);
        }
    });

    // Unified participant state for lobby display
    const [lobbyState, setLobbyState] = useState<LobbyUIState>({
        participants: [],
        creator: null,
        countdown: null
    });

    // Listen for unified participant events
    useEffect(() => {
        if (!socket) return;

        const handleParticipantsList = (payload: UnifiedParticipantListPayload) => {
            logger.info('[LOBBY] Received unified participants_list', payload);
            setLobbyState(prev => ({
                ...prev,
                participants: payload.participants,
                creator: payload.creator
            }));
        };

        const handleCountdownTick = (payload: { countdown: number }) => {
            logger.info('[LOBBY] Received countdown_tick', payload);
            setLobbyState(prev => ({ ...prev, countdown: payload.countdown }));
        };

        const handleCountdownComplete = () => {
            logger.info('[LOBBY] Received countdown_complete');
            setLobbyState(prev => ({ ...prev, countdown: 0 }));
        };

        // Use the existing socket event constant
        socket.on(SOCKET_EVENTS.LOBBY.PARTICIPANTS_LIST as any, handleParticipantsList);
        // These events are not in the typed interface yet, so use any
        (socket as any).on('countdown_tick', handleCountdownTick);
        (socket as any).on('countdown_complete', handleCountdownComplete);

        return () => {
            socket.off(SOCKET_EVENTS.LOBBY.PARTICIPANTS_LIST as any, handleParticipantsList);
            (socket as any).off('countdown_tick', handleCountdownTick);
            (socket as any).off('countdown_complete', handleCountdownComplete);
        };
    }, [socket]);

    // Show lobby UI when game status is pending (unified participant model)
    const showLobby = gameState.gameStatus === 'pending' && gameState.connectedToRoom;

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

    // Modern timer hook integration (canonical per-question)
    const timer = useSimpleTimer({
        accessCode: typeof code === 'string' ? code : '',
        socket,
        role: 'student'
    });
    // Canonical: get timer state for the current question
    const currentQuestionUid = gameState.currentQuestion?.uid;
    const timerState = currentQuestionUid ? timer.getTimerState(currentQuestionUid) : undefined;


    // Local UI state
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [numericAnswer, setNumericAnswer] = useState<string>(''); // State for numeric questions
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>("");
    const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");
    const [isMobile, setIsMobile] = useState(false);
    const [lastErrorTimestamp, setLastErrorTimestamp] = useState<number>(0);
    const [startClicked, setStartClicked] = useState(false);

    // Feedback system state
    const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
    const [feedbackText, setFeedbackText] = useState<string>("");
    const [feedbackDuration, setFeedbackDuration] = useState<number>(0);

    // Leaderboard modal state
    const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

    // Use stable leaderboard reference to prevent unnecessary re-renders
    const stableLeaderboard = useMemo(() => {
        return gameState.leaderboard.length > 0 ? gameState.leaderboard : EMPTY_LEADERBOARD;
    }, [gameState.leaderboard]);
    // Calculate user's score and rank from leaderboard
    const userLeaderboardData = useMemo(() => {
        logger.info('🏆 [USER-LEADERBOARD] Calculating user leaderboard data', {
            userId,
            leaderboardLength: stableLeaderboard.length,
            leaderboard: stableLeaderboard
        });

        if (!userId || !stableLeaderboard.length) {
            logger.info('🏆 [USER-LEADERBOARD] No userId or empty leaderboard, returning defaults', {
                userId,
                leaderboardLength: stableLeaderboard.length
            });
            return { score: 0, rank: null, totalPlayers: 0 };
        }

        // Sort leaderboard by score and find user's position
        const sortedLeaderboard = [...stableLeaderboard].sort((a: any, b: any) => b.score - a.score);
        const userEntry = sortedLeaderboard.find((entry: any) => entry.userId === userId);
        const userRank = userEntry ? sortedLeaderboard.findIndex((entry: any) => entry.userId === userId) + 1 : null;

        const result = {
            score: userEntry?.score || 0,
            rank: userRank,
            totalPlayers: sortedLeaderboard.length
        };

        logger.info('🏆 [USER-LEADERBOARD] Calculated user leaderboard data', {
            userId,
            userEntry,
            result,
            sortedLeaderboard: sortedLeaderboard.map(entry => ({ userId: entry.userId, score: entry.score }))
        });

        return result;
    }, [userId, stableLeaderboard]);

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

    // Join the game ONLY when socket is connected and user data is ready
    const hasJoinedRef = useRef(false);
    useEffect(() => {
        if (userId && username && typeof code === 'string' && connected && !hasJoinedRef.current) {
            logger.info('Joining game with enhanced socket hook (on socket connect)');
            joinGame();
            hasJoinedRef.current = true;
        }
        // Reset join flag if code or user changes (e.g., navigating to a new game)
        // This ensures joinGame is called again if the user switches games or logs in/out
        // (code/userId/username are all dependencies)
        // Reset if disconnected
        if (!connected) {
            hasJoinedRef.current = false;
        }
    }, [userId, username, code, connected, joinGame]);

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

    // Handle socket errors - force show snackbar even for repeated errors
    useEffect(() => {
        console.log('🔥 [SNACKBAR DEBUG] socketError effect triggered:', {
            socketError,
            hasError: !!socketError,
            timestamp: Date.now()
        });
        if (socketError) {
            // Strip timestamp from error message (format: "message|timestamp")
            const displayMessage = socketError.includes('|') ? socketError.split('|')[0] : socketError;
            console.log('🔥 [SNACKBAR DEBUG] Setting error snackbar:', displayMessage);
            // Always show error snackbar, even if same message
            setSnackbarType("error");
            setSnackbarMessage(displayMessage);
            setSnackbarOpen(true);
            console.log('🔥 [SNACKBAR DEBUG] Snackbar should now be open with message:', displayMessage);
            logger.debug('Showing error snackbar', { socketError: displayMessage });
        }
    }, [socketError]); // Only depend on socketError, not the snackbar state

    // Reset selected answers when question changes
    const previousQuestionUid = useRef(currentQuestionUid);
    useEffect(() => {
        // Only reset when we actually move to a different question
        if (currentQuestionUid && currentQuestionUid !== previousQuestionUid.current) {
            // Debug logger for question UID changes
            console.log('[MATHQUEST_QUESTION_UID_CHANGE]', {
                prev: previousQuestionUid.current,
                next: currentQuestionUid,
                timestamp: Date.now(),
            });
            setSelectedAnswer(null);
            setSelectedAnswers([]);
            // Only hide error snackbar if it's not a timer-related error
            if (snackbarType !== "error" || !snackbarMessage?.includes('temps')) {
                setSnackbarOpen(false);
            }
            setShowFeedbackOverlay(false); // Hide feedback when question changes
            previousQuestionUid.current = currentQuestionUid;
        }
    }, [currentQuestionUid, snackbarType, snackbarMessage]);

    // Get game mode directly from game state (now mandatory) and map to component mode
    const gameMode = useMemo(() => {
        const playMode = gameState.gameMode;
        // Map PlayMode to component-expected mode types
        switch (playMode) {
            case 'practice':
                return 'practice';
            case 'quiz':
            case 'class' // Map class mode to quiz for component compatibility
                :
                return 'quiz';
            case 'tournament':
            default:
                return 'tournament';
        }
    }, [gameState.gameMode]);

    // Helper: is multiple choice
    const isMultipleChoice = useMemo(() => {
        const questionType = gameState.currentQuestion?.questionType;
        // Handle both camelCase (from backend) and snake_case (from constants)
        return questionType === QUESTION_TYPES.MULTIPLE_CHOICE ||
            questionType === 'multipleChoice' ||
            questionType === 'multiple_choice';
    }, [gameState.currentQuestion?.questionType]);

    // Reset answers when question changes
    useEffect(() => {
        setSelectedAnswer(null);
        setSelectedAnswers([]);
        setNumericAnswer('');
    }, [gameState.currentQuestion?.uid]);

    // Handle single choice answer submission
    const handleSingleChoice = useCallback((idx: number) => {
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
    }, [gameState.gameStatus, gameState.currentQuestion, selectedAnswer, gameMode, submitAnswer]);

    // Handle multiple choice answer submission
    const handleSubmitMultiple = useCallback(() => {
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
    }, [gameState.gameStatus, gameState.currentQuestion, selectedAnswers, gameMode, submitAnswer]);

    // Handle numeric question answer submission
    const handleNumericSubmit = useCallback(() => {
        if (gameState.gameStatus !== 'active' || !numericAnswer.trim()) {
            if (!numericAnswer.trim()) {
                setSnackbarMessage("Veuillez entrer une réponse numérique.");
                setSnackbarType("error");
                setSnackbarOpen(true);
            }
            return;
        }

        if (!gameState.currentQuestion) return;

        const clientTimestamp = Date.now();
        logger.debug('Submitting numeric answer', {
            questionUid: gameState.currentQuestion.uid,
            answer: numericAnswer,
            clientTimestamp,
            gameMode
        });

        // Convert to number for submission
        const numericValue = parseFloat(numericAnswer);
        if (isNaN(numericValue)) {
            setSnackbarMessage("Veuillez entrer un nombre valide.");
            setSnackbarType("error");
            setSnackbarOpen(true);
            return;
        }

        submitAnswer(gameState.currentQuestion.uid, numericValue, clientTimestamp);
    }, [gameState.gameStatus, gameState.currentQuestion, numericAnswer, gameMode, submitAnswer]);

    // Wrapper function to handle both string and number inputs for numeric answer
    const handleNumericAnswerChange = useCallback((value: string | number) => {
        setNumericAnswer(String(value));
    }, []);

    // Handle next question request (for practice mode)
    const handleRequestNextQuestion = useCallback(() => {
        if (gameMode === 'practice' && gameState.currentQuestion) {
            logger.debug('Requesting next question in practice mode');
            requestNextQuestion(gameState.currentQuestion.uid);
        }
    }, [gameMode, gameState.currentQuestion, requestNextQuestion]);

    // Memoized modal handlers
    const handleLeaderboardOpen = useCallback(() => {
        logger.info('🏆 [FAB] Mobile leaderboard FAB clicked', {
            userId,
            leaderboardLength: stableLeaderboard.length,
            userRank: userLeaderboardData.rank,
            userScore: userLeaderboardData.score
        });
        setShowLeaderboardModal(true);
    }, [userId, stableLeaderboard.length, userLeaderboardData.rank, userLeaderboardData.score]);

    const handleLeaderboardClose = useCallback(() => {
        logger.info('🏆 [MODAL] Leaderboard modal closed');
        setShowLeaderboardModal(false);
    }, []);

    const handleFeedbackClose = useCallback(() => {
        setShowFeedbackOverlay(false);
    }, []);

    const handleFeedbackReopen = useCallback(() => {
        setShowFeedbackOverlay(true);
    }, []);

    // Debug timer value (development only)
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            logger.debug('Timer debug:', {
                canonicalTimer: timerState,
                gameMode,
                isTimerShown: gameMode !== 'practice'
            });
        }
    }, [timerState, gameMode]);

    // Debug FAB visibility conditions
    useEffect(() => {
        const mobileFabShouldShow = isMobile && userId && stableLeaderboard.length > 0 && userLeaderboardData.rank;
        const desktopFabShouldShow = !isMobile && userId && stableLeaderboard.length > 0 && userLeaderboardData.rank;
        logger.info('🏆 [FAB-DEBUG] FAB visibility check', {
            isMobile,
            userId: !!userId,
            leaderboardLength: stableLeaderboard.length,
            userRank: userLeaderboardData.rank,
            mobileFabShouldShow,
            desktopFabShouldShow,
            timestamp: Date.now()
        });
    }, [isMobile, userId, stableLeaderboard.length, userLeaderboardData.rank]);

    const isReadonly = useMemo(() => {
        return gameState.phase === 'show_answers' ||
            gameState.gameStatus === 'completed' ||
            (gameState.answered && gameMode === 'practice');
    }, [gameState.phase, gameState.gameStatus, gameState.answered, gameMode]);

    // Transform correctAnswers from number[] to boolean[] for QuestionCard
    const correctAnswersBoolean = useMemo(() => {
        // gameState.correctAnswers is already boolean[] from the socket hook
        return gameState.phase === 'show_answers' && gameState.correctAnswers ? gameState.correctAnswers : undefined;
    }, [gameState.phase, gameState.correctAnswers]);

    // Extract numeric answer data for visual feedback
    const numericCorrectAnswer = useMemo(() => {
        return gameState.phase === 'show_answers' && gameState.numericAnswer ? gameState.numericAnswer : null;
    }, [gameState.phase, gameState.numericAnswer]);

    // Auto-hide snackbar after 2 seconds
    useEffect(() => {
        console.log('🔥 [AUTO-HIDE DEBUG] Auto-hide effect triggered:', { snackbarOpen });
        if (snackbarOpen) {
            console.log('🔥 [AUTO-HIDE DEBUG] Setting 2s timer to hide snackbar');
            const timer = setTimeout(() => {
                console.log('🔥 [AUTO-HIDE DEBUG] Auto-hiding snackbar after 2s');
                setSnackbarOpen(false);
            }, 2000);
            return () => {
                console.log('🔥 [AUTO-HIDE DEBUG] Clearing auto-hide timer');
                clearTimeout(timer);
            };
        }
        return () => { }; // Return empty cleanup function when snackbar is not open
    }, [snackbarOpen]); // Only depend on snackbarOpen

    // Show lobby UI if game is pending and user is connected
    const [showQrModal, setShowQrModal] = useState(false);
    if (showLobby) {
        logger.info('[LOBBY] Rendering lobby with unified participant model', {
            gameStatus: gameState.gameStatus,
            participantCount: lobbyState.participants.length,
            creator: lobbyState.creator?.username
        });

        // Determine if current user is the creator
        const isCreator = lobbyState.creator && lobbyState.creator.userId === userId;

        // Render the start button only for the creator and tournament mode
        const startButton = isCreator && gameState.gameMode === 'tournament' && !startClicked ? (
            <div className="flex justify-end w-full mt-4">
                <button
                    className="btn btn-primary btn-lg px-6"
                    onClick={() => {
                        if (socket) {
                            socket.emit('start_tournament', { accessCode: typeof code === 'string' ? code : String(code) });
                            setStartClicked(true);
                        }
                    }}
                >
                    Démarrer
                </button>
            </div>
        ) : null;

        // Share and QR buttons
        const handleShare = () => {
            if (navigator.share) {
                navigator.share({
                    title: 'Rejoindre la partie',
                    text: `Rejoignez la partie sur MathQuest avec le code : ${code}`,
                    url: window.location.href
                }).catch(() => { });
            } else {
                navigator.clipboard.writeText(window.location.href);
            }
        };

        const shareButton = (
            <div className="flex gap-0 items-center">
                <button
                    className="p-2 rounded hover:bg-[color:var(--muted)] transition-colors"
                    title="Partager le lien"
                    onClick={handleShare}
                >
                    {/* Share icon from lucide-react */}
                    <span className="sr-only">Partager</span>
                    <Share2 size={20} />
                </button>
                <button
                    className="p-2 rounded hover:bg-[color:var(--muted)] transition-colors"
                    title="QR Code"
                    onClick={() => setShowQrModal(true)}
                >
                    <span className="sr-only">QR Code</span>
                    <QrCode size={20} />
                </button>
            </div>
        );

        return (
            <>
                <LobbyLayout
                    creator={lobbyState.creator ? (
                        <>
                            <div className="w-[50px] h-[50px] rounded-full border-2 flex items-center justify-center text-3xl" style={{ borderColor: "var(--secondary)" }}>
                                {lobbyState.creator.avatarEmoji}
                            </div>
                            <span className="font-bold text-lg truncate">{lobbyState.creator.username}</span>
                        </>
                    ) : <span>Chargement...</span>}
                    code={null}
                    shareButton={shareButton}
                    participantsHeader={<div className="font-semibold text-lg">Participants connectés</div>}
                    participantsList={lobbyState.participants.map((p, i) => (
                        <div key={p.userId ? `${p.userId}-${i}` : i} className="flex flex-col items-center">
                            <div className="w-[49px] h-[49px] rounded-full border-2 flex items-center justify-center text-3xl" style={{ borderColor: "var(--primary)" }}>{p.avatarEmoji}</div>
                            <span className="text-sm mt-0 truncate max-w-[70px]">{p.username}</span>
                        </div>
                    ))}
                    startButton={startButton}
                    countdown={lobbyState.countdown !== null ? <div className="text-5xl font-extrabold text-primary mt-2 text-right w-full">{lobbyState.countdown}</div> : null}
                />
                {/* QR Modal */}
                <InfoModal
                    isOpen={showQrModal}
                    onClose={() => setShowQrModal(false)}
                    title={null}
                    size="sm"
                    showCloseButton={false}
                >
                    <div className="flex flex-col items-center justify-center gap-0 p-0">
                        <div className="flex items-center justify-center w-full" style={{ minWidth: 220, minHeight: 220 }}>
                            <QrCodeWithLogo
                                value={window.location.href}
                                size={220}
                                logoWidth={45}
                                logoHeight={45}
                                responsive={false}
                                style={{ width: 220, height: 220 }}
                            />
                        </div>
                        <div className="flex justify-end w-full mt-4">
                            <button
                                className="px-4 py-2 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)] transition min-w-[100px]"
                                onClick={() => setShowQrModal(false)}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </InfoModal>
            </>
        );
    }

    // Otherwise, show the live game UI
    return (
        <div className="main-content">
            {/* Enhanced Feedback Overlay */}
            {showFeedbackOverlay && (
                <div className="feedback-overlay">
                    <AnswerFeedbackOverlay
                        explanation={feedbackText}
                        duration={feedbackDuration}
                        onClose={handleFeedbackClose}
                        isCorrect={gameState.lastAnswerFeedback?.correct}
                        correctAnswers={gameState.correctAnswers || undefined}
                        answerOptions={gameState.currentQuestion?.answerOptions}
                        showTimer={gameMode !== 'practice'} // Hide timer for practice mode
                        mode={gameMode}
                        allowManualClose={gameMode === 'practice'}
                    />
                </div>
            )}

            {/* Main Question Card */}
            <div className={`card w-full max-w-2xl bg-base-100 rounded-lg shadow-xl my-6 relative${showFeedbackOverlay ? " blur-sm" : ""}`}>
                {/* Memoized Timer Display */}
                <TimerDisplay gameMode={gameMode} timerState={timerState} isMobile={isMobile} />

                <MathJaxWrapper>
                    {gameState.currentQuestion && (
                        <QuestionCard
                            currentQuestion={gameState.currentQuestion}
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
                            correctAnswers={correctAnswersBoolean}
                            readonly={isReadonly}
                            numericAnswer={numericAnswer}
                            setNumericAnswer={setNumericAnswer}
                            handleNumericSubmit={handleNumericSubmit}
                            numericCorrectAnswer={numericCorrectAnswer}
                        />
                    )}
                </MathJaxWrapper>

                {/* Enhanced practice mode progression */}
                <PracticeModeProgression
                    gameMode={gameMode}
                    answered={gameState.answered}
                    showFeedbackOverlay={showFeedbackOverlay}
                    questionIndex={gameState.questionIndex}
                    totalQuestions={gameState.totalQuestions}
                    handleRequestNextQuestion={handleRequestNextQuestion}
                    hasExplanation={!!gameState.lastAnswerFeedback?.explanation}
                    onReopenFeedback={handleFeedbackReopen}
                    currentQuestion={gameState.currentQuestion}
                />
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
                    onClose={handleFeedbackClose}
                    isCorrect={gameState.lastAnswerFeedback?.correct}
                    allowManualClose={gameMode === 'practice'}
                    mode={gameMode}
                />
            )}

            {/* Leaderboard FAB (Mobile: right side, Desktop: top left) */}
            <LeaderboardFAB
                isMobile={isMobile}
                userId={userId}
                leaderboardLength={stableLeaderboard.length}
                userRank={userLeaderboardData.rank}
                onOpen={handleLeaderboardOpen}
            />

            {/* Leaderboard Modal */}
            <LeaderboardModal
                isOpen={showLeaderboardModal}
                onClose={handleLeaderboardClose}
                leaderboard={stableLeaderboard}
                currentUserId={userId}
            />
        </div>
    );
}