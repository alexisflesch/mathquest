"use client";
import AnswerDebug from '@/components/AnswerDebug';
import QrCodeWithLogo from '@/components/QrCodeWithLogo';
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { useStudentGameSocket, type AnswerReceived } from '@/hooks/useStudentGameSocket';
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
import type { LeaderboardEntry, GameParticipant } from '@shared/types/core/participant';
import { ParticipantStatus } from '@shared/types/core/participant';
import LobbyLayout from '@/components/LobbyLayout';
import { LobbyParticipantListPayload } from '@shared/types/lobbyParticipantListPayload';

// Logging
const logger = createLogger('LiveGamePage');

// Stable empty objects to prevent re-renders
const EMPTY_LEADERBOARD: LeaderboardEntry[] = [];

interface LobbyUIState {
    participants: GameParticipant[];
    creator: GameParticipant | null;
    countdown: number | null;
}

type StoredSingleAnswer = {
    type: 'single';
    value: number | null;
};

type StoredMultipleAnswer = {
    type: 'multiple';
    value: number[];
};

type StoredNumericAnswer = {
    type: 'numeric';
    value: string;
};

type StoredAnswer = StoredSingleAnswer | StoredMultipleAnswer | StoredNumericAnswer;

type PendingAnswer = {
    questionUid: string;
    state: StoredAnswer;
};

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
    const searchParams = useSearchParams();
    const { userState, userProfile, isLoading, logout } = useAuth();

    // Check if this is a differed session
    const isDiffered = searchParams?.get('differed') === '1';

    const userId = userProfile.userId || userProfile.cookieId || `temp_${Date.now()}`;
    const username: string | null = userProfile.username ?? null;
    const avatarEmoji = userProfile.avatar;

    // Socket hook
    const {
        socket,
        gameState,
        connected,
        error: socketError,
        errorVersion: socketErrorVersion,
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

    // Track answered questions by UID to allow re-answering when teacher restarts same question
    const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
    const [hasEncounteredFirstQuestion, setHasEncounteredFirstQuestion] = useState(false);
    const [firstQuestionIndex, setFirstQuestionIndex] = useState<number | null>(null);
    const [acceptedAnswers, setAcceptedAnswers] = useState<Record<string, StoredAnswer>>({});
    const [pendingAnswer, setPendingAnswer] = useState<PendingAnswer | null>(null);
    const lastProcessedFeedbackRef = useRef<AnswerReceived | null>(null);
    const lastProcessedErrorVersionRef = useRef<number | null>(null);

    // Stable leaderboard
    const stableLeaderboard = useMemo(() => {
        return gameState.leaderboard?.length > 0 ? gameState.leaderboard : EMPTY_LEADERBOARD;
    }, [gameState.leaderboard]);

    const userLeaderboardData = useMemo(() => {
        if (!userId || !stableLeaderboard.length) {
            return { score: 0, rank: null, totalPlayers: 0 };
        }
        const sorted = [...stableLeaderboard].sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score);
        const entry = sorted.find((e: LeaderboardEntry) => e.userId === userId);
        return {
            score: entry?.score || 0,
            rank: entry ? sorted.findIndex((e: LeaderboardEntry) => e.userId === userId) + 1 : null,
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
        const handleParticipantsList = (payload: LobbyParticipantListPayload) => {
            // Map LobbyParticipant to GameParticipant for compatibility
            const mappedParticipants: GameParticipant[] = payload.participants.map(p => ({
                id: p.userId || '', // Use userId as id, fallback to empty string
                userId: p.userId || '',
                username: p.username,
                avatarEmoji: p.avatarEmoji,
                score: 0, // Default score for lobby
                socketId: undefined,
                online: true,
                joinedAt: Date.now(),
                isDeferred: false,
                status: ParticipantStatus.PENDING,
                attemptCount: 0,
                cookieId: undefined
            }));
            const mappedCreator: GameParticipant = {
                id: payload.creator.userId,
                userId: payload.creator.userId,
                username: payload.creator.username,
                avatarEmoji: payload.creator.avatarEmoji,
                score: 0,
                socketId: undefined,
                online: true,
                joinedAt: Date.now(),
                isDeferred: false,
                status: ParticipantStatus.PENDING,
                attemptCount: 0,
                cookieId: undefined
            };
            setLobbyState(prev => ({
                ...prev, participants: mappedParticipants, creator: mappedCreator
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
        setPendingAnswer(null);
        lastProcessedFeedbackRef.current = null;
        lastProcessedErrorVersionRef.current = null;
    }, [gameState.currentQuestion?.uid]);

    // Reset feedback overlay when appropriate (separate from answer reset)
    useEffect(() => {
        // Reset feedback overlay when moving to a new question, but preserve it during feedback phases
        if (gameState.phase !== 'feedback' && !(gameState.gameMode === 'practice' && gameState.lastAnswerFeedback?.explanation)) {
            setShowFeedbackOverlay(false);
        }
    }, [gameState.currentQuestion?.uid, gameState.phase, gameState.gameMode, gameState.lastAnswerFeedback]);

    // Track first question encountered for FAB display logic
    useEffect(() => {
        if (gameState.currentQuestion && !hasEncounteredFirstQuestion) {
            setHasEncounteredFirstQuestion(true);
            setFirstQuestionIndex(gameState.questionIndex);
        }
    }, [gameState.currentQuestion, hasEncounteredFirstQuestion, gameState.questionIndex]);

    // Game mode
    const gameMode = useMemo(() => {
        switch (gameState.gameMode) {
            case 'practice': return 'practice';
            case 'quiz': return 'quiz';
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
        console.log('🎯 [FRONTEND-ANSWER-CLICK] Answer button clicked:', {
            answerIndex: idx,
            gameStatus: gameState.gameStatus,
            questionUid: gameState.currentQuestion?.uid,
            previousSelection: selectedAnswer,
            socketConnected: !!socket,
            timestamp: new Date().toISOString()
        });

        if (!gameState.currentQuestion) {
            console.log('🚫 [FRONTEND-ANSWER-CLICK] Early return - no question available:', {
                gameStatus: gameState.gameStatus,
                hasQuestion: !!gameState.currentQuestion
            });
            return;
        }

        const nextSelection = idx === selectedAnswer ? null : idx;
        setSelectedAnswer(nextSelection);
        console.log('✅ [FRONTEND-ANSWER-CLICK] About to submit answer:', {
            questionUid: gameState.currentQuestion.uid,
            answer: idx,
            timeSpent: Date.now()
        });

        // Show immediate feedback
        setSnackbarType("success");
        setSnackbarMessage("Envoi de la réponse...");
        setSnackbarOpen(true);

        submitAnswer(gameState.currentQuestion.uid, idx, Date.now());

        setPendingAnswer({
            questionUid: gameState.currentQuestion.uid,
            state: {
                type: 'single',
                value: nextSelection
            }
        });
    }, [gameState, selectedAnswer, submitAnswer, socket]);

    const handleSubmitMultiple = useCallback(() => {
        if (!gameState.currentQuestion) return;
        if (!selectedAnswers.length) {
            setSnackbarMessage("Veuillez sélectionner au moins une réponse.");
            setSnackbarType("error");
            setSnackbarOpen(true);
            return;
        }

        // Show immediate feedback
        setSnackbarType("success");
        setSnackbarMessage("Envoi de la réponse...");
        setSnackbarOpen(true);

        submitAnswer(gameState.currentQuestion.uid, selectedAnswers, Date.now());

        setPendingAnswer({
            questionUid: gameState.currentQuestion.uid,
            state: {
                type: 'multiple',
                value: [...selectedAnswers]
            }
        });
    }, [gameState, selectedAnswers, submitAnswer]);

    const handleNumericSubmit = useCallback(() => {
        if (!gameState.currentQuestion) return;
        const val = parseFloat(numericAnswer);
        if (isNaN(val)) {
            setSnackbarMessage("Veuillez entrer une réponse numérique.");
            setSnackbarType("error");
            setSnackbarOpen(true);
            return;
        }

        // Show immediate feedback
        setSnackbarType("success");
        setSnackbarMessage("Envoi de la réponse...");
        setSnackbarOpen(true);

        submitAnswer(gameState.currentQuestion.uid, val, Date.now());

        setPendingAnswer({
            questionUid: gameState.currentQuestion.uid,
            state: {
                type: 'numeric',
                value: numericAnswer
            }
        });
    }, [gameState, numericAnswer, submitAnswer]);

    useEffect(() => {
        const feedback = gameState.lastAnswerFeedback;
        if (!feedback) {
            return;
        }

        if (feedback === lastProcessedFeedbackRef.current) {
            return;
        }

        lastProcessedFeedbackRef.current = feedback;

        if (!pendingAnswer || feedback.questionUid !== pendingAnswer.questionUid) {
            return;
        }

        logger.info('[LIVE-ANSWER] Processing answer feedback', {
            questionUid: feedback.questionUid,
            pendingType: pendingAnswer.state.type,
            feedbackKeys: Object.keys(feedback || {}),
            acceptedAnswersBefore: acceptedAnswers[pendingAnswer.questionUid]
        });
        console.log('NUMERIC::feedback', {
            questionUid: feedback.questionUid,
            pendingType: pendingAnswer.state.type,
            hasPending: !!pendingAnswer,
            feedbackKeys: Object.keys(feedback || {}),
            feedbackJson: JSON.stringify(feedback),
            pendingValue: pendingAnswer.state.value
        });

        const questionUid = feedback.questionUid;

        const nextAccepted: StoredAnswer = pendingAnswer.state.type === 'multiple'
            ? { type: 'multiple', value: [...pendingAnswer.state.value] }
            : pendingAnswer.state.type === 'single'
                ? { type: 'single', value: pendingAnswer.state.value }
                : { type: 'numeric', value: pendingAnswer.state.value };

        setAcceptedAnswers(prev => ({
            ...prev,
            [questionUid]: nextAccepted
        }));

        logger.info('[LIVE-ANSWER] Stored accepted answer', {
            questionUid,
            acceptedType: nextAccepted.type,
            acceptedValue: nextAccepted.value
        });
        console.log('NUMERIC::stored', {
            questionUid,
            acceptedType: nextAccepted.type,
            acceptedValue: nextAccepted.value
        });

        // Note: We do NOT update the UI state here (setSelectedAnswer, setNumericAnswer, etc.)
        // because the UI already shows the submitted value. Only update acceptedAnswers for reversion logic.

        setAnsweredQuestions(prev => {
            const next = new Set(prev);
            next.add(questionUid);
            return next;
        });

        setPendingAnswer(null);
    }, [gameState.lastAnswerFeedback, pendingAnswer, setSelectedAnswer, setSelectedAnswers, setNumericAnswer]);

    useEffect(() => {
        if (!pendingAnswer || !socketError) {
            return;
        }

        if (socketErrorVersion === null) {
            return;
        }

        if (lastProcessedErrorVersionRef.current === socketErrorVersion) {
            return;
        }

        lastProcessedErrorVersionRef.current = socketErrorVersion;

        const accepted = acceptedAnswers[pendingAnswer.questionUid];

        const baseMessage = socketError.includes('|') ? socketError.split('|')[0] : socketError;
        const normalized = baseMessage.toLowerCase();
        const isKnownLateRejection = normalized.includes('trop tard')
            || normalized.includes('time is up')
            || normalized.includes('timer_stopped')
            || normalized.includes('answers are locked')
            || normalized.includes('déjà')
            || normalized.includes('already submitted');

        logger.info('[LIVE-ANSWER] Evaluating socket error for answer revert', {
            socketError: baseMessage,
            isKnownLateRejection,
            hasAcceptedState: !!accepted,
            pendingType: pendingAnswer.state.type,
            acceptedType: accepted?.type,
            errorVersion: socketErrorVersion
        });
        console.log('NUMERIC::error', {
            socketError: baseMessage,
            isKnownLateRejection,
            hasAcceptedState: !!accepted,
            pendingType: pendingAnswer.state.type,
            acceptedType: accepted?.type,
            errorVersion: socketErrorVersion,
            pendingValue: pendingAnswer.state.value,
            acceptedValue: accepted?.value
        });

        if (!isKnownLateRejection && !accepted) {
            return;
        }

        if (pendingAnswer.state.type === 'single') {
            const fallback = accepted && accepted.type === 'single' ? accepted.value : null;
            setSelectedAnswer(fallback ?? null);
        } else if (pendingAnswer.state.type === 'multiple') {
            const fallback = accepted && accepted.type === 'multiple' ? [...accepted.value] : [];
            setSelectedAnswers(() => fallback);
        } else {
            const fallback = accepted && accepted.type === 'numeric' ? accepted.value : '';
            setNumericAnswer(fallback ?? '');
        }

        logger.info('[LIVE-ANSWER] Reverted answer after socket error', {
            questionUid: pendingAnswer.questionUid,
            appliedFallbackType: accepted?.type ?? 'default',
            pendingType: pendingAnswer.state.type
        });
        console.log('NUMERIC::reverted', {
            questionUid: pendingAnswer.questionUid,
            appliedFallbackType: accepted?.type ?? 'default',
            pendingType: pendingAnswer.state.type,
            fallbackValue: pendingAnswer.state.type === 'numeric'
                ? (accepted && accepted.type === 'numeric' ? accepted.value : '')
                : accepted
        });

        setPendingAnswer(null);
    }, [socketError, socketErrorVersion, pendingAnswer, acceptedAnswers, setSelectedAnswer, setSelectedAnswers, setNumericAnswer]);

    const handleRequestNextQuestion = useCallback(() => {
        if (gameMode === 'practice' && gameState.currentQuestion) {
            requestNextQuestion(gameState.currentQuestion.uid);
        }
    }, [gameMode, gameState.currentQuestion, requestNextQuestion]);

    const handleLeaderboardOpen = useCallback(() => setShowLeaderboardModal(true), []);
    const handleLeaderboardClose = useCallback(() => setShowLeaderboardModal(false), []);

    const isReadonly = useMemo(() => {
        // Always readonly if showing answers or game is finished
        if (gameState.phase === 'show_answers' || gameState.gameStatus === 'finished') {
            return true;
        }

        // For practice mode, only readonly if we've answered THIS specific question
        // BUT allow re-answering if we're in the 'question' phase (teacher actively showing question)
        if (gameMode === 'practice' && gameState.currentQuestion) {
            const hasAnsweredThisQuestion = answeredQuestions.has(gameState.currentQuestion.uid);
            const isActiveQuestionPhase = gameState.phase === 'question';

            // If teacher is actively showing the question (question phase), allow answering even if previously answered
            if (isActiveQuestionPhase) {
                return false;
            }

            // Otherwise, readonly if we've answered this question
            return hasAnsweredThisQuestion;
        }

        return false;
    }, [gameState.phase, gameState.gameStatus, gameMode, gameState.currentQuestion, answeredQuestions]);

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
        return () => { }; // Return empty cleanup function when snackbarOpen is false
    }, [snackbarOpen]);

    // 🚨 IMPORTANT: Returns must come *after* hooks
    // If auth is resolved and the user is not authenticated for gameplay, disconnect and redirect to login
    const redirectOnceRef = useRef(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (isLoading) return;

        const accessCode = typeof code === 'string' ? code : Array.isArray(code) ? code[0] : '';
        const missingProfile = !userProfile.username || !userProfile.avatar;
        if ((userState === 'anonymous' || missingProfile) && !redirectOnceRef.current) {
            redirectOnceRef.current = true;
            (async () => {
                try {
                    // Ensure any stale auth cookies are cleared before redirecting
                    await logout();
                } catch (_) {
                    // Ignore logout errors and proceed with redirect
                } finally {
                    try {
                        router.replace(`/login?returnTo=${encodeURIComponent(`/live/${accessCode}`)}`);
                    } catch (_) {
                        // noop - tests may not have full router impl
                    }
                }
            })();
        }
    }, [isLoading, userState, userProfile.username, userProfile.avatar, code, router, logout]);

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

    if (gameState.gameStatus === 'waiting' && gameState.connectedToRoom && !gameState.currentQuestion) {
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
                isQuestionCompleted={gameState.phase !== 'question'}
                questionIndex={gameState.questionIndex}
                isFirstQuestionOfSession={firstQuestionIndex !== null && gameState.questionIndex === firstQuestionIndex}
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