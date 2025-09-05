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
import PracticeModeProgression from '../components/PracticeModeProgression';
import LeaderboardFAB from '../components/LeaderboardFAB';
import TimerDisplay from '../components/TimerDisplay';
import QuestionDisplay from '../components/QuestionDisplay';
import LobbyDisplay from '../components/LobbyDisplay';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { motion } from 'framer-motion';
import type { GameParticipant } from '@shared/types/core/participant';
import LobbyLayout from '@/components/LobbyLayout';

// Logging
const logger = createLogger('LiveGamePage');

// Stable empty objects to prevent re-renders
const EMPTY_LEADERBOARD: any[] = [];

interface UnifiedParticipantListPayload {
    participants: GameParticipant[];
    creator: GameParticipant;
}

interface LobbyUIState {
    participants: GameParticipant[];
    creator: GameParticipant | null;
    countdown: number | null;
}

export default function LiveGamePage() {
    // Debug render count
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());

    useEffect(() => {
        renderCount.current++;
        const now = Date.now();
        logger.info(`🔄 Re-render #${renderCount.current} (${now - lastRenderTime.current}ms since last)`);
        lastRenderTime.current = now;
    });

    const { code } = useParams();
    const router = useRouter();
    const { userState, userProfile, isLoading } = useAuth();

    const userId = userProfile.userId || userProfile.cookieId || `temp_${Date.now()}`;
    const username: string | null = userProfile.username ?? null;
    const avatarEmoji = userProfile.avatar;

    // Socket hook
    const {
        socket,
        gameState,
        connected,
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

    // Timer
    const timer = useSimpleTimer({
        accessCode: typeof code === 'string' ? code : '',
        socket,
        role: 'student'
    });
    const currentQuestionUid = gameState.currentQuestion?.uid;
    const timerState = currentQuestionUid ? timer.getTimerState(currentQuestionUid) : undefined;

    // Lobby state
    const [lobbyState, setLobbyState] = useState<LobbyUIState>({
        participants: [],
        creator: null,
        countdown: null
    });

    // Feedback state
    const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
    const [feedbackText, setFeedbackText] = useState<string>("");
    const [feedbackDuration, setFeedbackDuration] = useState<number>(0);

    // Leaderboard modal
    const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

    // UI state
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [numericAnswer, setNumericAnswer] = useState<string>('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>("");
    const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");
    const [isMobile, setIsMobile] = useState(false);
    const [startClicked, setStartClicked] = useState(false);

    // Stable leaderboard
    const stableLeaderboard = useMemo(() => {
        return gameState.leaderboard?.length > 0 ? gameState.leaderboard : EMPTY_LEADERBOARD;
    }, [gameState.leaderboard]);

    const userLeaderboardData = useMemo(() => {
        if (!userId || !stableLeaderboard.length) {
            return { score: 0, rank: null, totalPlayers: 0 };
        }
        const sorted = [...stableLeaderboard].sort((a: any, b: any) => b.score - a.score);
        const entry = sorted.find((e: any) => e.userId === userId);
        return {
            score: entry?.score || 0,
            rank: entry ? sorted.findIndex((e: any) => e.userId === userId) + 1 : null,
            totalPlayers: sorted.length
        };
    }, [userId, stableLeaderboard]);

    // Resize listener
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Game join
    const hasJoinedRef = useRef(false);
    useEffect(() => {
        if (userId && username && typeof code === 'string' && connected && !hasJoinedRef.current) {
            joinGame();
            hasJoinedRef.current = true;
        }
        if (!connected) hasJoinedRef.current = false;
    }, [userId, username, code, connected, joinGame]);

    // User profile debug
    useEffect(() => {
        logger.info('UserProfile state', { userProfile });
    }, [userProfile]);

    // Lobby events
    useEffect(() => {
        if (!socket) return;
        const handleParticipantsList = (payload: UnifiedParticipantListPayload) => {
            setLobbyState(prev => ({
                ...prev, participants: payload.participants, creator: payload.creator
            }));
        };
        const handleCountdownTick = (payload: { countdown: number }) => {
            setLobbyState(prev => ({ ...prev, countdown: payload.countdown }));
        };
        const handleCountdownComplete = () => {
            setLobbyState(prev => ({ ...prev, countdown: 0 }));
        };
        socket.on(SOCKET_EVENTS.LOBBY.PARTICIPANTS_LIST as any, handleParticipantsList);
        (socket as any).on('countdown_tick', handleCountdownTick);
        (socket as any).on('countdown_complete', handleCountdownComplete);
        return () => {
            socket.off(SOCKET_EVENTS.LOBBY.PARTICIPANTS_LIST as any, handleParticipantsList);
            (socket as any).off('countdown_tick', handleCountdownTick);
            (socket as any).off('countdown_complete', handleCountdownComplete);
        };
    }, [socket]);

    // Feedback overlay handling
    useEffect(() => {
        if (gameState.gameMode === 'practice' && gameState.lastAnswerFeedback?.explanation) {
            setFeedbackText(gameState.lastAnswerFeedback.explanation);
            setFeedbackDuration(10);
            setShowFeedbackOverlay(true);
        } else if (gameState.phase === 'feedback' && gameState.feedbackRemaining !== null) {
            const fb = gameState.lastAnswerFeedback?.explanation
                ?? (gameState.lastAnswerFeedback?.correct !== undefined
                    ? (gameState.lastAnswerFeedback.correct ? "Bonne réponse ✅" : "Mauvaise réponse ❌")
                    : "Réponse enregistrée");
            setFeedbackText(fb);
            setFeedbackDuration(gameState.feedbackRemaining || 5);
            setShowFeedbackOverlay(true);
        } else if (gameState.phase === 'question' && gameState.gameMode !== 'practice') {
            // Only reset overlay for non-practice modes when moving to question phase
            setShowFeedbackOverlay(false);
            setFeedbackText("");
        }
    }, [gameState.phase, gameState.feedbackRemaining, gameState.gameMode, gameState.lastAnswerFeedback]);

    // Socket errors => Snackbar
    useEffect(() => {
        if (socketError) {
            const msg = socketError.includes('|') ? socketError.split('|')[0] : socketError;
            setSnackbarType("error");
            setSnackbarMessage(msg);
            setSnackbarOpen(true);
        }
    }, [socketError]);

    // Reset answers when question changes
    useEffect(() => {
        setSelectedAnswer(null);
        setSelectedAnswers([]);
        setNumericAnswer('');
    }, [gameState.currentQuestion?.uid]);

    // Reset feedback overlay when appropriate (separate from answer reset)
    useEffect(() => {
        // Reset feedback overlay when moving to a new question, but preserve it during feedback phases
        if (gameState.phase !== 'feedback' && !(gameState.gameMode === 'practice' && gameState.lastAnswerFeedback?.explanation)) {
            setShowFeedbackOverlay(false);
        }
    }, [gameState.currentQuestion?.uid, gameState.phase, gameState.gameMode, gameState.lastAnswerFeedback]);

    // Game mode
    const gameMode = useMemo(() => {
        switch (gameState.gameMode) {
            case 'practice': return 'practice';
            case 'quiz':
            case 'class': return 'quiz';
            case 'tournament':
            default: return 'tournament';
        }
    }, [gameState.gameMode]);

    const isMultipleChoice = useMemo(() => {
        const qType = gameState.currentQuestion?.questionType;
        return qType === QUESTION_TYPES.MULTIPLE_CHOICE || qType === 'multipleChoice' || qType === 'multiple_choice';
    }, [gameState.currentQuestion?.questionType]);

    // Handlers
    const handleSingleChoice = useCallback((idx: number) => {
        if (gameState.gameStatus !== 'active' || !gameState.currentQuestion) return;
        setSelectedAnswer(idx === selectedAnswer ? null : idx);
        submitAnswer(gameState.currentQuestion.uid, idx, Date.now());
    }, [gameState, selectedAnswer, submitAnswer]);

    const handleSubmitMultiple = useCallback(() => {
        if (gameState.gameStatus !== 'active' || !gameState.currentQuestion) return;
        if (!selectedAnswers.length) {
            setSnackbarMessage("Veuillez sélectionner au moins une réponse.");
            setSnackbarType("error");
            setSnackbarOpen(true);
            return;
        }
        submitAnswer(gameState.currentQuestion.uid, selectedAnswers, Date.now());
    }, [gameState, selectedAnswers, submitAnswer]);

    const handleNumericSubmit = useCallback(() => {
        if (gameState.gameStatus !== 'active' || !gameState.currentQuestion) return;
        const val = parseFloat(numericAnswer);
        if (isNaN(val)) {
            setSnackbarMessage("Veuillez entrer une réponse numérique.");
            setSnackbarType("error");
            setSnackbarOpen(true);
            return;
        }
        submitAnswer(gameState.currentQuestion.uid, val, Date.now());
    }, [gameState, numericAnswer, submitAnswer]);

    const handleRequestNextQuestion = useCallback(() => {
        if (gameMode === 'practice' && gameState.currentQuestion) {
            requestNextQuestion(gameState.currentQuestion.uid);
        }
    }, [gameMode, gameState.currentQuestion, requestNextQuestion]);

    const handleLeaderboardOpen = useCallback(() => setShowLeaderboardModal(true), []);
    const handleLeaderboardClose = useCallback(() => setShowLeaderboardModal(false), []);

    const isReadonly = useMemo(() => {
        return gameState.phase === 'show_answers' || gameState.gameStatus === 'completed' || (gameState.answered && gameMode === 'practice');
    }, [gameState.phase, gameState.gameStatus, gameState.answered, gameMode]);

    const correctAnswersBoolean = useMemo(() => {
        return gameState.phase === 'show_answers' && gameState.correctAnswers ? gameState.correctAnswers : undefined;
    }, [gameState.phase, gameState.correctAnswers]);

    const numericCorrectAnswer = useMemo(() => {
        return gameState.phase === 'show_answers' ? gameState.numericAnswer : null;
    }, [gameState.phase, gameState.numericAnswer]);

    // Auto-hide snackbar
    useEffect(() => {
        if (snackbarOpen) {
            const t = setTimeout(() => setSnackbarOpen(false), 2000);
            return () => clearTimeout(t);
        }
    }, [snackbarOpen]);

    // 🚨 IMPORTANT: Returns must come *after* hooks
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <InfinitySpin size={48} />
                <p className="mt-4 text-gray-600">Vérification de l&apos;authentification...</p>
            </div>
        );
    }

    if (userState === 'anonymous' || !userProfile.username || !userProfile.avatar) {
        return null;
    }

    if (gameState.gameStatus === 'pending' && gameState.connectedToRoom) {
        return (
            <LobbyDisplay
                lobbyState={lobbyState}
                gameMode={gameMode}
                userId={userId}
                socket={socket}
                code={code}
                startClicked={startClicked}
                setStartClicked={setStartClicked}
            />
        );
    }

    // Final UI
    return (
        <div className="main-content">
            {showFeedbackOverlay && (
                <div className="feedback-overlay">
                    <AnswerFeedbackOverlay
                        explanation={feedbackText}
                        duration={feedbackDuration}
                        onClose={() => setShowFeedbackOverlay(false)}
                        isCorrect={gameState.lastAnswerFeedback?.correct}
                        correctAnswers={gameState.correctAnswers || undefined}
                        answerOptions={gameState.currentQuestion?.answerOptions}
                        showTimer={gameMode !== 'practice'}
                        mode={gameMode}
                        allowManualClose={gameMode === 'practice'}
                    />
                </div>
            )}

            <div className={`card w-full max-w-2xl bg-base-100 shadow-xl my-6 ${showFeedbackOverlay ? "blur-sm" : ""}`}>
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

                <PracticeModeProgression
                    gameMode={gameMode}
                    answered={gameState.answered}
                    showFeedbackOverlay={showFeedbackOverlay}
                    questionIndex={gameState.questionIndex}
                    totalQuestions={gameState.totalQuestions}
                    handleRequestNextQuestion={handleRequestNextQuestion}
                    hasExplanation={!!gameState.lastAnswerFeedback?.explanation}
                    onReopenFeedback={() => setShowFeedbackOverlay(true)}
                    currentQuestion={gameState.currentQuestion}
                />
            </div>

            <Snackbar
                open={snackbarOpen}
                message={snackbarMessage}
                type={snackbarType}
                onClose={() => setSnackbarOpen(false)}
                className={showFeedbackOverlay ? "blur-sm" : ""}
            />

            <LeaderboardFAB
                isMobile={isMobile}
                userId={userId}
                leaderboardLength={stableLeaderboard.length}
                userRank={userLeaderboardData.rank}
                userScore={userLeaderboardData.score}
                onOpen={handleLeaderboardOpen}
            />

            <LeaderboardModal
                isOpen={showLeaderboardModal}
                onClose={handleLeaderboardClose}
                leaderboard={stableLeaderboard}
                currentUserId={userId}
            />
        </div>
    );
}