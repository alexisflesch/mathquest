"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import DraggableQuestionsList from "@/components/DraggableQuestionsList";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createLogger } from '@/clientLogger';
import { useSimpleTimer } from '@/hooks/useSimpleTimer';
import { useAuthState } from '@/hooks/useAuthState';
import { useAccessGuard } from '@/hooks/useAccessGuard';
import { UsersRound } from "lucide-react";
import type { Question } from '@shared/types/core/question';
import InfinitySpin from '@/components/InfinitySpin';
import LoadingScreen from '@/components/LoadingScreen';
import { QUESTION_TYPES } from '@shared/types';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { gameControlStatePayloadSchema, type GameControlStatePayload } from '@shared/types/socketEvents.zod.dashboard';
import type { ConnectedCountPayload, JoinDashboardPayload, EndGamePayload, DashboardAnswerStatsUpdatePayload } from '@shared/types/socket/dashboardPayloads';
import { io, Socket } from 'socket.io-client';
import { SOCKET_CONFIG } from '@/config';
import { computeTimeLeftMs } from '../utils/computeTimeLeftMs';
import { makeApiRequest } from '@/config/api';

// Derive type from Zod schema for type safety
// type ConnectedCountPayload = z.infer<typeof connectedCountPayloadSchema>;
// type JoinDashboardPayload = z.infer<typeof joinDashboardPayloadSchema>;
// type EndGamePayload = z.infer<typeof endGamePayloadSchema>;

const logger = createLogger('TeacherDashboard');

function mapToCanonicalQuestion(q: any): Question {
    const questionData = q.question || q;
    const answerOptions = questionData.answerOptions || [];
    const correctAnswers = questionData.correctAnswers || [];
    // Canonical: always use durationMs in ms, never timeLimit
    const durationMs = questionData.durationMs ?? q.durationMs;

    return {
        ...q,
        text: questionData.text || q.text,
        uid: questionData.uid || q.uid,
        answerOptions,
        correctAnswers,
        durationMs, // canonical ms
        defaultMode: q.questionType || questionData.questionType || QUESTION_TYPES.SINGLE_CHOICE,
        feedbackWaitTime: questionData.feedbackWaitTime ?? q.feedbackWaitTime ?? 3000
        // No timeLimit, no legacy fields
    } as Question;
}

export default function TeacherDashboardClient({ code, gameId }: { code: string, gameId: string }) {
    // --- Canonical timer sync: update per-question durationMs after every timer update ---
    const lastTimerQuestionUidRef = useRef<string | null>(null);
    const lastTimerDurationMsRef = useRef<number | null>(null);

    // Authentication and access control (following established pattern)
    const { isTeacher, isAuthenticated, isLoading: authLoading, userState, userProfile } = useAuthState();
    useAccessGuard({ requireMinimum: 'teacher', redirectTo: '/login' });

    // Basic state
    const [questions, setQuestions] = useState<Question[]>([]);
    const [quizName, setQuizName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI state
    const [questionActiveUid, setQuestionActiveUid] = useState<string | null>(null);
    const [expandedUids, setExpandedUids] = useState<Set<string>>(new Set());
    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
    const [showStats, setShowStats] = useState<boolean>(false); // NEW: global stats toggle

    // Confirmation dialogs
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingPlayIdx, setPendingPlayIdx] = useState<number | null>(null);
    const [showEndQuizConfirm, setShowEndQuizConfirm] = useState(false);

    // Restore missing handlers for end quiz (move above return)
    function handleEndQuiz() { setShowEndQuizConfirm(true); }
    function confirmEndQuiz() {
        setShowEndQuizConfirm(false);
        if (quizSocket && code) {
            const payload: EndGamePayload = { accessCode: code };
            try {
                // endGamePayloadSchema.parse(payload);
                quizSocket.emit(SOCKET_EVENTS.TEACHER.END_GAME, payload);
            } catch (error) {
                logger.error('Invalid end_game payload:', error);
            }
        }
    }
    function cancelEndQuiz() { setShowEndQuizConfirm(false); }

    // Socket and quiz state
    const [quizSocket, setQuizSocket] = useState<Socket | null>(null);
    const [quizState, setQuizState] = useState<any>(null);
    const [connectedCount, setConnectedCount] = useState(0);
    const [answerStats, setAnswerStats] = useState<Record<string, Record<string, number>>>({});

    // Fetch game data
    useEffect(() => {
        if (authLoading || !isAuthenticated || !isTeacher) {
            logger.info('Waiting for authentication:', {
                authLoading,
                isAuthenticated,
                isTeacher,
                code,
                userState,
                userProfile
            });
            return;
        }
        if (!code) {
            logger.warn('No game code provided');
            setError('No game code provided');
            setLoading(false);
            return;
        }
        logger.info('Setting up socket connection for game code:', code);
        // Keep loading=true until socket data arrives
    }, [code, authLoading, isAuthenticated, isTeacher]);

    useEffect(() => {
        if (!isAuthenticated || !isTeacher || !code) {
            logger.debug('Skipping socket initialization - waiting for auth:', { isAuthenticated, isTeacher, hasCode: !!code });
            return;
        }
        logger.info('Initializing socket connection');
        const socket = io(SOCKET_CONFIG.url, {
            ...SOCKET_CONFIG,
            autoConnect: true
        });
        socket.on(SOCKET_EVENTS.CONNECT, () => {
            logger.info('Socket connected:', socket.id);
            logger.info('Joining dashboard with accessCode:', code);
            const payload: JoinDashboardPayload = { accessCode: code };
            try {
                // joinDashboardPayloadSchema.parse(payload);
                socket.emit(SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD, payload);
            } catch (error) {
                logger.error('Invalid join_dashboard payload:', error);
            }
            logger.info('📡 Dashboard attempting to join rooms via JOIN_DASHBOARD event');
        });
        socket.onAny((eventName, ...args) => {
            if (eventName !== 'timer_updated' && eventName !== 'dashboard_timer_updated') {
                logger.debug('Socket event:', eventName, ...args);
            }
        });
        socket.on(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE, (state: any) => {
            // Validate and strongly type the payload
            const parsed = gameControlStatePayloadSchema.safeParse(state);
            if (!parsed.success) {
                logger.error('Invalid GAME_CONTROL_STATE payload', parsed.error);
                return;
            }
            const canonicalState: GameControlStatePayload = parsed.data;

            logger.info('Dashboard state received:', canonicalState);
            if (canonicalState.gameId) {
                logger.info(`📍 Dashboard should be listening for stats in room: dashboard_${canonicalState.gameId}`);
                logger.info(`📍 Alternative room format (if quiz mode): teacher_<userId>_${code}`);
                logger.info(`📍 Current accessCode: ${code}`);
            }
            // Prefer templateName for activity name
            if (canonicalState.templateName) {
                setQuizName(canonicalState.templateName);
            }
            if (canonicalState.questions) {
                const processedQuestions = canonicalState.questions.map(mapToCanonicalQuestion);
                setQuestions(processedQuestions);
                logger.info('Questions loaded:', processedQuestions.length);
            }
            if (canonicalState.currentQuestionUid) {
                setQuestionActiveUid(canonicalState.currentQuestionUid);
                logger.info('Setting current question from initial state:', canonicalState.currentQuestionUid);
            }
            if (
                canonicalState.currentQuestionUid &&
                canonicalState.answerStats &&
                typeof canonicalState.answerStats === "object"
            ) {
                setAnswerStats(prev => ({
                    ...prev,
                    [String(canonicalState.currentQuestionUid)]: canonicalState.answerStats as Record<string, number>
                }));
                logger.info('✅ Loaded initial answer stats for question:', canonicalState.currentQuestionUid, canonicalState.answerStats);
            }
            let computedTimeLeftMs: number | undefined = undefined;
            if (canonicalState.timer) {
                logger.info('📡 Received initial timer state from backend:', canonicalState.timer);
                logger.info('📡 Backend should emit dashboard_timer_updated event separately');
                if (typeof canonicalState.timer.timerEndDateMs === 'number') {
                    computedTimeLeftMs = computeTimeLeftMs(canonicalState.timer.timerEndDateMs);
                }
            }
            setQuizState({ ...canonicalState, computedTimeLeftMs });
            setLoading(false);
        });
        socket.on('quiz_connected_count', (data: ConnectedCountPayload) => {
            // const validation = connectedCountPayloadSchema.safeParse(data);
            // if (!validation.success) {
            //     logger.error('quiz_connected_count validation failed:', validation.error);
            //     return;
            // }
            setConnectedCount(data.count);
        });
        socket.on(SOCKET_EVENTS.TEACHER.DASHBOARD_ANSWER_STATS_UPDATE, (payload: DashboardAnswerStatsUpdatePayload) => {
            logger.info('🎯 RECEIVED answer stats update:', payload);
            if (payload.stats && payload.questionUid) {
                setAnswerStats(prev => ({
                    ...prev,
                    [payload.questionUid]: payload.stats
                }));
                logger.info('✅ Answer stats updated for question:', payload.questionUid, payload.stats);
            }
        });
        socket.on(SOCKET_EVENTS.TEACHER.ANSWER_STATS_UPDATE, (payload: DashboardAnswerStatsUpdatePayload) => {
            logger.info('🎯 RECEIVED alternative answer stats update:', payload);
            if (payload.stats && payload.questionUid) {
                setAnswerStats(prev => ({
                    ...prev,
                    [payload.questionUid]: payload.stats
                }));
                logger.info('✅ Answer stats updated via alternative event:', payload.questionUid, payload.stats);
            }
        });
        const statsCheckInterval = setInterval(() => {
            logger.debug('📊 Current answer stats state:', answerStats);
            logger.debug('📊 Current gameId:', gameId);
            logger.debug('📊 Current questions:', questions.map(q => q.uid));
            logger.debug('📊 Socket connected:', socket.connected);
            if (gameId) {
                logger.debug(`📊 Expected dashboard room: dashboard_${gameId}`);
                logger.debug(`📊 Expected quiz mode room: teacher_<userId>_${code}`);
            }
            const hasAnyStats = Object.keys(answerStats).length > 0;
            logger.debug('📊 Has any answer stats:', hasAnyStats);
            if (!hasAnyStats && questions.length > 0) {
                logger.warn('⚠️ No answer stats received yet, but questions are loaded. Possible room mismatch?');
            }
        }, 10000);
        socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
            logger.error('Socket connection error:', error);
            setError('Failed to connect to game server');
            setLoading(false);
        });
        socket.on(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, (error: any) => {
            logger.error('Dashboard error:', error);
            // Show verbose error details if present
            if (error.details) {
                logger.error('Dashboard error details:', error.details);
                setError(`Dashboard error: ${error.message || 'Unknown error'}\nDetails: ${JSON.stringify(error.details, null, 2)}`);
            } else {
                setError(`Dashboard error: ${error.message || 'Unknown error'}`);
            }
            setLoading(false);
        });
        setQuizSocket(socket);
        return () => {
            logger.info('Disconnecting socket');
            clearInterval(statsCheckInterval);
            socket.disconnect();
        };
    }, [isAuthenticated, isTeacher, code]);

    // --- Canonical timer state: use per-question timer state from useSimpleTimer ---
    const {
        getTimerState,
        timerStates,
        activeQuestionUid: timerActiveQuestionUid,
        startTimer,
        pauseTimer,
        stopTimer,
        editTimer,
        isConnected
    } = useSimpleTimer({
        role: 'teacher',
        accessCode: typeof code === 'string' ? code : '',
        socket: quizSocket
    });

    // Helper: get canonical timer state for a question
    const getCanonicalTimerForQuestion = (questionUid: string) => getTimerState(questionUid) || {
        timeLeftMs: 0,
        durationMs: questions.find(q => q.uid === questionUid)?.durationMs ?? 0,
        status: 'stop',
        questionUid,
        isActive: false
    };

    // Canonical: always use timer state from useSimpleTimer for timer display/actions
    const timerStatus = timerActiveQuestionUid ? getCanonicalTimerForQuestion(timerActiveQuestionUid).status : 'stop';
    const timerQuestionUid = timerActiveQuestionUid;
    const timeLeftMs = timerActiveQuestionUid ? getCanonicalTimerForQuestion(timerActiveQuestionUid).timeLeftMs : 0;
    const timerDurationMs = timerActiveQuestionUid ? getCanonicalTimerForQuestion(timerActiveQuestionUid).durationMs : 0;

    // Ref for timer state (for play/confirm logic)
    const timerStateRef = useRef({
        status: timerStatus,
        questionUid: timerQuestionUid,
        timeLeftMs: timeLeftMs
    });
    useEffect(() => {
        timerStateRef.current = {
            status: timerStatus,
            questionUid: timerQuestionUid,
            timeLeftMs: timeLeftMs
        };
    }, [timerStatus, timerQuestionUid, timeLeftMs]);

    const mappedQuestions = useMemo(() => {
        return questions.map(mapToCanonicalQuestion);
    }, [questions]);

    const handleSelect = useCallback((uid: string) => {
        setQuestionActiveUid(uid);
    }, []);
    const handleToggleExpand = useCallback((uid: string) => {
        setExpandedUids(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uid)) {
                newSet.delete(uid);
            } else {
                newSet.add(uid);
            }
            return newSet;
        });
    }, []);
    const handlePlay = useCallback((uid: string, _timeLeftMs: number) => {
        const currentTimerState = timerStateRef.current;
        const currentTimerStatus = currentTimerState.status;
        const currentTimerQuestionUid = currentTimerState.questionUid;
        if ((currentTimerStatus === 'run' || currentTimerStatus === 'pause') && currentTimerQuestionUid !== uid) {
            const playIdx = questions.findIndex(q => q.uid === uid);
            if (playIdx !== -1) {
                setPendingPlayIdx(playIdx);
                setShowConfirm(true);
                return;
            }
        }
        handleSelect(uid);
        // Always use the teacher's intended durationMs from the UI/question object
        const intendedDurationMs = questions.find(q => q.uid === uid)?.durationMs ?? 0;
        logger.info('[DASHBOARD][PLAY] Emitting startTimer with teacher-intended durationMs', { uid, intendedDurationMs });
        startTimer(uid, intendedDurationMs);
    }, [questions, startTimer, handleSelect]);
    const handlePause = useCallback(() => { pauseTimer(); }, [pauseTimer]);
    const handleStop = useCallback(() => { stopTimer(); }, [stopTimer]);
    const handleEditTimer = useCallback((uid: string, newTime: number) => {
        logger.info(`[DASHBOARD] handleEditTimer called`, { uid, newTime, unit: 'ms' });
        setQuestions(prevQs => {
            const updated = prevQs.map(q =>
                q.uid === uid ? { ...q, durationMs: newTime } : q
            );
            logger.info('[DEBUG] handleEditTimer: questions after edit', updated.map(q => ({ uid: (q as any).uid, durationMs: (q as any).durationMs })));
            return updated;
        });
        // Canonical: editTimer only takes (questionUid, durationMs)
        logger.info(`[DASHBOARD] Timer edit: canonical editTimer(uid, durationMs)`, { uid, durationMs: newTime });
        editTimer(uid, newTime);
        logger.info(`[DASHBOARD] Timer edit emitted for question ${uid}: ${newTime}ms`);
    }, [editTimer, timerStatus, timeLeftMs]);
    const handleTimerAction = useCallback((action: { status: 'run' | 'pause' | 'stop' | 'edit', questionUid: string, timeLeftMs: number, newTime?: number }) => {
        switch (action.status) {
            case 'run':
                startTimer(action.questionUid, action.timeLeftMs);
                break;
            case 'pause':
                pauseTimer();
                break;
            case 'stop':
                stopTimer();
                break;
            case 'edit': {
                logger.info(`[DASHBOARD] handleEditTimer (via handleTimerAction) called`, { uid: action.questionUid, newTime: action.newTime, unit: 'ms' });
                const editMs = typeof action.newTime === 'number' ? action.newTime : action.timeLeftMs;
                // Canonical: editTimer only takes (questionUid, durationMs)
                logger.info(`[DASHBOARD] Timer edit: canonical editTimer(uid, durationMs)`, { uid: action.questionUid, durationMs: editMs });
                editTimer(action.questionUid, editMs);
                logger.info(`[DASHBOARD] Timer edit emitted for question ${action.questionUid}: ${editMs}ms`);
                break;
            }
        }
    }, [startTimer, pauseTimer, stopTimer, editTimer, timerStatus, timeLeftMs]);
    const handleReorder = useCallback((newQuestions: Question[]) => {
        setQuestions(newQuestions);
    }, []);
    const confirmPlay = useCallback(() => {
        setShowConfirm(false);
        if (pendingPlayIdx !== null && questions[pendingPlayIdx]) {
            const question = questions[pendingPlayIdx];
            handleSelect(question.uid);
            stopTimer();
            // Always use the teacher's intended durationMs from the UI/question object
            logger.info('[DASHBOARD][CONFIRM PLAY] Emitting startTimer with teacher-intended durationMs', { uid: question.uid, intendedDurationMs: question.durationMs });
            startTimer(question.uid, question.durationMs);
        }
        setPendingPlayIdx(null);
    }, [pendingPlayIdx, questions, handleSelect, stopTimer, startTimer]);
    const cancelPlay = useCallback(() => {
        setShowConfirm(false);
        setPendingPlayIdx(null);
    }, []);
    const handleShowResults = useCallback((questionUid: string) => {
        if (!quizSocket) return;
        const payload = {
            accessCode: code,
            gameId,
            questionUid,
            teacherId: userProfile?.userId
        };
        quizSocket.emit(SOCKET_EVENTS.TEACHER.SHOW_CORRECT_ANSWERS, payload);
        setTimeout(() => {
            setSnackbarMessage(`Affichage des bonnes réponses pour la question ${questionUid}`);
        }, 0);
    }, [quizSocket, code, gameId, userProfile?.userId]);
    // Remove handleStatsToggle, replace with global version
    const handleStatsToggleGlobal = useCallback(() => {
        if (!quizSocket) return;
        const newShow = !showStats;
        setShowStats(newShow);
        const payload = {
            accessCode: code,
            gameId,
            show: newShow,
            teacherId: userProfile?.userId
        };
        quizSocket.emit(SOCKET_EVENTS.TEACHER.TOGGLE_PROJECTION_STATS, payload);
        setTimeout(() => {
            const action = newShow ? 'affichage' : 'masquage';
            setSnackbarMessage(`${action} global des statistiques`);
        }, 0);
    }, [quizSocket, code, gameId, userProfile?.userId, showStats]);

    // Trophy button logic (no questionUid)
    const handleTrophyGlobal = useCallback(() => {
        if (!quizSocket) return;
        // Reveal leaderboard and show correct answers globally
        const revealLeaderboardPayload = { accessCode: code };
        quizSocket.emit(SOCKET_EVENTS.TEACHER.REVEAL_LEADERBOARD, revealLeaderboardPayload);
        quizSocket.emit(SOCKET_EVENTS.TEACHER.SHOW_CORRECT_ANSWERS, { accessCode: code, gameId, teacherId: userProfile?.userId });
        setTimeout(() => {
            setSnackbarMessage('Affichage des bonnes réponses et du classement final (global)');
        }, 0);
    }, [quizSocket, code, gameId, userProfile?.userId]);

    // Fetch quiz/activity name from API for reliability
    useEffect(() => {
        async function fetchQuizName() {
            if (!code) return;
            try {
                // Modernization: Use makeApiRequest to Next.js API route
                const data = await makeApiRequest<any>(`/api/games/access-code/${code}`);
                // Prefer templateName for activity name
                if (data && typeof data === 'object') {
                    if (data.gameInstance && data.gameInstance.templateName) {
                        setQuizName(data.gameInstance.templateName);
                    } else if (data.templateName) {
                        setQuizName(data.templateName);
                    } else if (data.gameInstance && data.gameInstance.quizName) {
                        setQuizName(data.gameInstance.quizName);
                    } else if (data.quizName) {
                        setQuizName(data.quizName);
                    }
                }
            } catch (err) {
                logger.warn('Failed to fetch quiz name from API:', err);
            }
        }
        fetchQuizName();
    }, [code]);

    if (authLoading) return <LoadingScreen message="Vérification de l'authentification..." />;
    if (loading) return <LoadingScreen message="Chargement du tableau de bord..." />;
    if (error) return <div className="p-8 text-red-600">Erreur: {error}</div>;
    if (!code) return <div className="p-8 text-orange-600">Aucun code d'accès fourni.</div>;
    const isDisabled = !quizSocket || !quizSocket.connected || quizState?.ended;
    // Add a projection page URL for the current code
    const projectionUrl = `/teacher/projection/${code}`;
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-background border-b border-[color:var(--border)] px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto py-4 sm:py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                                Activité <span className="italic">{quizName || '...'}</span>
                            </h1>
                            {/* Projection page link */}
                            <a
                                href={projectionUrl}
                                className="text-blue-600 underline text-sm mt-1 inline-block"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Afficher la page de projection
                            </a>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                <UsersRound className="w-4 h-4" />
                                {connectedCount} participant{connectedCount <= 1 ? '' : 's'} connecté{connectedCount <= 1 ? '' : 's'}
                            </p>
                        </div>
                        <div className="hidden sm:block">
                            <button
                                className="btn btn-secondary flex items-center gap-2 whitespace-nowrap"
                                onClick={handleEndQuiz}
                                disabled={isDisabled}
                            >
                                {quizState?.ended ? 'Quiz Terminé' : 'Clôturer'}
                            </button>
                        </div>
                    </div>
                    {/* Mobile end quiz button */}
                    <div className="sm:hidden mt-4">
                        <button
                            className="btn btn-secondary w-full flex items-center justify-center gap-2"
                            onClick={handleEndQuiz}
                            disabled={isDisabled}
                        >
                            {quizState?.ended ? 'Quiz Terminé' : 'Clôturer'}
                        </button>
                    </div>
                </div>
            </div>
            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <InfinitySpin size={48} />
                        <p className="text-muted-foreground mt-4">Chargement du tableau de bord...</p>
                    </div>
                )}
                {/* Questions Section */}
                {!loading && (
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-xl font-semibold">Questions</h2>
                            {/* NEW: Global Stats and Trophy Buttons */}
                            <button
                                className={`btn btn-outline flex items-center gap-1 ${showStats ? 'bg-blue-100 text-blue-700' : ''}`}
                                onClick={handleStatsToggleGlobal}
                                disabled={isDisabled}
                                aria-pressed={showStats}
                                title="Afficher/Masquer les statistiques globales"
                            >
                                <span role="img" aria-label="Bar Chart">📊</span> Stats
                            </button>
                            <button
                                className="btn btn-outline flex items-center gap-1"
                                onClick={handleTrophyGlobal}
                                disabled={isDisabled}
                                title="Afficher le classement final et les bonnes réponses"
                            >
                                <span role="img" aria-label="Trophy">🏆</span> Trophy
                            </button>
                            {loading && <InfinitySpin size={32} />}
                        </div>
                        <DraggableQuestionsList
                            quizId={code}
                            currentTournamentCode={gameId}
                            quizSocket={quizSocket}
                            questions={mappedQuestions}
                            currentQuestionIdx={quizState?.currentQuestionidx}
                            isChronoRunning={quizState?.chrono?.running}
                            isQuizEnded={quizState?.ended}
                            questionActiveUid={questionActiveUid}
                            onSelect={handleSelect}
                            onPlay={handlePlay}
                            onPause={handlePause}
                            onStop={handleStop}
                            onEditTimer={handleEditTimer}
                            onReorder={handleReorder}
                            timerStatus={timerStatus}
                            timerQuestionUid={timerQuestionUid}
                            timeLeftMs={timeLeftMs}
                            timerDurationMs={timerDurationMs}
                            onTimerAction={handleTimerAction}
                            disabled={isDisabled}
                            expandedUids={expandedUids}
                            onToggleExpand={handleToggleExpand}
                            getStatsForQuestion={(uid: string) => {
                                const stats = answerStats[uid];
                                if (stats && typeof stats === 'object') {
                                    const question = mappedQuestions.find(q => q.uid === uid);
                                    const numOptions = question?.answerOptions?.length || 0;
                                    if (numOptions === 0) return undefined;
                                    const statsObj = stats as Record<string, number>;
                                    const percentageArray: number[] = [];
                                    for (let i = 0; i < numOptions; i++) {
                                        const percentage = statsObj[i.toString()] || 0;
                                        percentageArray.push(percentage);
                                    }
                                    return percentageArray;
                                }
                                return undefined;
                            }}
                            getTimerState={getCanonicalTimerForQuestion}
                        />
                    </section>
                )}
            </div>
            {/* Confirmation Dialog for Question Change */}
            <ConfirmDialog
                open={showConfirm}
                title="Changer de question ?"
                message="Une autre question est en cours ou en pause. Voulez-vous vraiment lancer cette nouvelle question et arrêter la précédente ?"
                onConfirm={confirmPlay}
                onCancel={cancelPlay}
            />
            {/* Confirmation Dialog for End Quiz */}
            <ConfirmDialog
                open={showEndQuizConfirm}
                title="Clôturer le quiz ?"
                message="Êtes-vous sûr de vouloir clôturer ce quiz ? Cette action est irréversible."
                onConfirm={confirmEndQuiz}
                onCancel={cancelEndQuiz}
            />
            {/* Snackbar */}
            {snackbarMessage && (
                <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
                    {snackbarMessage}
                </div>
            )}
        </div>
    );
}
