/**
 * Teacher Dashboard Page - Following Working Teacher Page Pattern
 * 
 * Uses socket connection for data fetching, like projection page and other working teacher pages.
 * No direct API calls - everything through socket events.
 */

"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import DraggableQuestionsList from "@/components/DraggableQuestionsList";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createLogger } from '@/clientLogger';
import { useSimpleTimer } from '@/hooks/useSimpleTimer';
import { useAuthState } from '@/hooks/useAuthState';
import { useAccessGuard } from '@/hooks/useAccessGuard';
import { UsersRound } from "lucide-react";
import { type Question } from '@/types/api';
import InfinitySpin from '@/components/InfinitySpin';
import LoadingScreen from '@/components/LoadingScreen';
import { QUESTION_TYPES } from '@shared/types';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { connectedCountPayloadSchema, joinDashboardPayloadSchema, endGamePayloadSchema } from '@shared/types/socketEvents.zod';
import { z } from 'zod';
import { io, Socket } from 'socket.io-client';
import { SOCKET_CONFIG } from '@/config';
import type { DashboardAnswerStatsUpdatePayload } from '@shared/types/socket/dashboardPayloads';

// Derive type from Zod schema for type safety
type ConnectedCountPayload = z.infer<typeof connectedCountPayloadSchema>;
type JoinDashboardPayload = z.infer<typeof joinDashboardPayloadSchema>;
type EndGamePayload = z.infer<typeof endGamePayloadSchema>;

const logger = createLogger('TeacherDashboard');

function mapToCanonicalQuestion(q: any): Question {
    const questionData = q.question || q;
    const answerOptions = questionData.answerOptions || [];
    const correctAnswers = questionData.correctAnswers || [];
    const timeLimit = questionData.timeLimit ?? q.timeLimit ?? 60;

    return {
        ...q,
        text: questionData.text || q.text,
        uid: questionData.uid || q.uid,
        answerOptions,
        correctAnswers,
        timeLimit,
        defaultMode: q.questionType || questionData.questionType || QUESTION_TYPES.SINGLE_CHOICE,
        feedbackWaitTime: questionData.feedbackWaitTime ?? q.feedbackWaitTime ?? 3000
    };
}

export default function TeacherDashboardPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = React.use(params);

    // Authentication and access control (following established pattern)
    const { isTeacher, isAuthenticated, isLoading: authLoading, userState, userProfile } = useAuthState();
    const { isAllowed } = useAccessGuard({
        requireMinimum: 'teacher',
        redirectTo: '/login'
    });

    // Basic state
    const [questions, setQuestions] = useState<Question[]>([]);
    const [quizName, setQuizName] = useState<string>("");
    const [gameId, setGameId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI state
    const [questionActiveUid, setQuestionActiveUid] = useState<string | null>(null);
    const [expandedUids, setExpandedUids] = useState<Set<string>>(new Set());
    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

    // Confirmation dialogs
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingPlayIdx, setPendingPlayIdx] = useState<number | null>(null);
    const [showEndQuizConfirm, setShowEndQuizConfirm] = useState(false);

    // Socket and quiz state
    const [quizSocket, setQuizSocket] = useState<Socket | null>(null);
    const [quizState, setQuizState] = useState<any>(null);
    const [connectedCount, setConnectedCount] = useState(0);
    const [answerStats, setAnswerStats] = useState<Record<string, Record<string, number>>>({});

    // Fetch game data
    useEffect(() => {
        // Wait for authentication to be resolved
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

        // Use socket-based connection (no API calls needed)
        logger.info('Setting up socket connection for game code:', code);
        // Keep loading=true until socket data arrives
    }, [code, authLoading, isAuthenticated, isTeacher]);

    // Initialize socket
    // Initialize socket (following working pattern - no manual token needed)
    useEffect(() => {
        if (!isAuthenticated || !isTeacher || !code) {
            logger.debug('Skipping socket initialization - waiting for auth:', { isAuthenticated, isTeacher, hasCode: !!code });
            return;
        }

        logger.info('Initializing socket connection');

        const socket = io(SOCKET_CONFIG.url, {
            ...SOCKET_CONFIG,
            autoConnect: true // Override for dashboard connection
        });

        socket.on(SOCKET_EVENTS.CONNECT, () => {
            logger.info('Socket connected:', socket.id);
            logger.info('Joining dashboard with accessCode:', code);

            const payload: JoinDashboardPayload = { accessCode: code };
            try {
                joinDashboardPayloadSchema.parse(payload);
                socket.emit(SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD, payload);
            } catch (error) {
                logger.error('Invalid join_dashboard payload:', error);
            }

            // Debug: Log all socket events to debug room joining
            logger.info('📡 Dashboard attempting to join rooms via JOIN_DASHBOARD event');
        });

        // Add a catch-all event listener to see what events we're receiving
        socket.onAny((eventName, ...args) => {
            if (eventName !== 'timer_updated' && eventName !== 'dashboard_timer_updated') {
                // Avoid spamming with timer events, but log all others
                logger.debug(`Socket received event: ${eventName}`, args);
            } else {
                // Special logging for timer events
                logger.info(`🕒 Socket received TIMER event: ${eventName}`, args);
            }
        }); socket.on(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE, (state: any) => {
            logger.info('Dashboard state received:', state);

            // The backend sends the gameId directly, not wrapped in gameInstance
            if (state.gameId) {
                const newGameId = state.gameId;
                logger.info('Setting gameId:', newGameId);
                setGameId(newGameId);
                setQuizName("Quiz"); // We'll get the proper name later or from the questions

                // Log which dashboard room we should be in for stats
                logger.info(`📍 Dashboard should be listening for stats in room: dashboard_${newGameId}`);
                logger.info(`📍 Alternative room format (if quiz mode): teacher_<userId>_${code}`);
                logger.info(`📍 Current accessCode: ${code}`);
            }

            if (state.questions) {
                const processedQuestions = state.questions.map(mapToCanonicalQuestion);
                setQuestions(processedQuestions);
                logger.info('Questions loaded:', processedQuestions.length);
            }

            // NEW: Set current question from initial state
            if (state.currentQuestionUid) {
                setQuestionActiveUid(state.currentQuestionUid);
                logger.info('Setting current question from initial state:', state.currentQuestionUid);
            }

            // NEW: Load initial answer stats from state if available
            if (state.answerStats && state.currentQuestionUid) {
                setAnswerStats(prev => ({
                    ...prev,
                    [state.currentQuestionUid]: state.answerStats
                }));
                logger.info('✅ Loaded initial answer stats for question:', state.currentQuestionUid, state.answerStats);
            }

            // CRITICAL: Initial timer state will be sent separately by backend
            if (state.timer) {
                logger.info('📡 Received initial timer state from backend:', state.timer);
                logger.info('📡 Backend should emit dashboard_timer_updated event separately');
            }

            setQuizState(state);
            setLoading(false);
        });

        socket.on('quiz_connected_count', (data: ConnectedCountPayload) => {
            // Validate payload with Zod schema
            const validation = connectedCountPayloadSchema.safeParse(data);
            if (!validation.success) {
                logger.error('quiz_connected_count validation failed:', validation.error);
                return;
            }
            setConnectedCount(validation.data.count);
        });

        // Listen for answer stats updates
        socket.on(SOCKET_EVENTS.TEACHER.DASHBOARD_ANSWER_STATS_UPDATE, (payload: DashboardAnswerStatsUpdatePayload) => {
            logger.info('🎯 RECEIVED answer stats update:', payload);
            logger.info('🎯 Stats payload breakdown:', {
                hasStats: !!payload.stats,
                hasQuestionUid: !!payload.questionUid,
                statsType: typeof payload.stats,
                statsKeys: payload.stats ? Object.keys(payload.stats) : 'none',
                statsValues: payload.stats ? Object.values(payload.stats) : 'none'
            });

            if (payload.stats && payload.questionUid) {
                // Update the stats for this specific question
                setAnswerStats(prev => {
                    const newStats = {
                        ...prev,
                        [payload.questionUid]: payload.stats
                    };
                    logger.info('✅ Answer stats updated for question:', payload.questionUid, payload.stats);
                    logger.info('📊 Complete stats state after update:', newStats);
                    return newStats;
                });
            } else {
                logger.warn('❌ Invalid answer stats payload:', payload);
            }
        });

        // Also listen for any stats-related events (in case the event name is different)
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

        // Add a timeout to periodically check if we have stats
        const statsCheckInterval = setInterval(() => {
            logger.debug('📊 Current answer stats state:', answerStats);
            logger.debug('📊 Current gameId:', gameId);
            logger.debug('📊 Current questions:', questions.map(q => q.uid));
            logger.debug('📊 Socket connected:', socket.connected);
            logger.debug('📊 Socket rooms (client cannot see this, but logging for completeness)');
            if (gameId) {
                logger.debug(`📊 Expected dashboard room: dashboard_${gameId}`);
                logger.debug(`📊 Expected quiz mode room: teacher_<userId>_${code}`);
            }

            // Check if we have any answer stats at all
            const hasAnyStats = Object.keys(answerStats).length > 0;
            logger.debug('📊 Has any answer stats:', hasAnyStats);

            if (!hasAnyStats && questions.length > 0) {
                logger.warn('⚠️ No answer stats received yet, but questions are loaded. Possible room mismatch?');
            }
        }, 10000); // Every 10 seconds

        socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
            logger.error('Socket connection error:', error);
            setError('Failed to connect to game server');
            setLoading(false);
        });

        socket.on(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, (error: any) => {
            logger.error('Dashboard error:', error);
            setError(`Dashboard error: ${error.message || 'Unknown error'}`);
            setLoading(false);
        });

        setQuizSocket(socket);

        return () => {
            logger.info('Disconnecting socket');
            clearInterval(statsCheckInterval);
            socket.disconnect();
        };
    }, [isAuthenticated, isTeacher, code]);

    // Simple timer hook (following the live page pattern exactly)
    const {
        status: timerStatus,
        questionUid: timerQuestionUid,
        timeLeftMs,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer
    } = useSimpleTimer({
        role: 'teacher',
        accessCode: typeof code === 'string' ? code : '',
        socket: quizSocket
    });

    // DEBUG: Log when timer hook dependencies change (simplified)
    useEffect(() => {
        logger.info('[TeacherDashboard] useSimpleTimer dependencies changed:', {
            hasSocket: !!quizSocket,
            accessCode: typeof code === 'string' ? code : '',
            codeType: typeof code
        });
    }, [code, quizSocket]);

    // Log timer state changes for debugging (less frequently)
    useEffect(() => {
        logger.info('Dashboard timer state changed:', {
            timerStatus,
            timerQuestionUid,
            timeLeftMs: timeLeftMs,
            hasSocket: !!quizSocket
        });
    }, [timerStatus, timerQuestionUid, timeLeftMs]);

    // Keep a ref to the current timer state for reliable access during callbacks
    const timerStateRef = useRef({
        status: timerStatus,
        questionUid: timerQuestionUid,
        timeLeftMs: timeLeftMs
    });

    // Update the ref whenever timer state changes
    useEffect(() => {
        timerStateRef.current = {
            status: timerStatus,
            questionUid: timerQuestionUid,
            timeLeftMs: timeLeftMs
        };
    }, [timerStatus, timerQuestionUid, timeLeftMs]);

    // Debug showConfirm state changes
    useEffect(() => {
        logger.info(`Dashboard: showConfirm state changed to ${showConfirm}, pendingPlayIdx: ${pendingPlayIdx}`);
    }, [showConfirm, pendingPlayIdx]);

    // // Debug timer state updates
    // useEffect(() => {
    //     logger.info(`Dashboard timer state updated:`, {
    //         timerStatus,
    //         timerQuestionUid,
    //         timeLeftMs
    //     });
    // }, [timerStatus, timerQuestionUid, timeLeftMs]);

    // Debug individual timer state changes to track when questionUid gets reset
    useEffect(() => {
        logger.debug(`Dashboard timerQuestionUid changed to: ${timerQuestionUid}`);
        if (timerQuestionUid === null) {
            logger.warn(`Dashboard timerQuestionUid was reset to null - this might be the bug!`);
            console.trace('timerQuestionUid reset stack trace');
        }
    }, [timerQuestionUid]);

    // Sync active question with timer
    useEffect(() => {
        if (timerQuestionUid) {
            setQuestionActiveUid(timerQuestionUid);
        }
    }, [timerQuestionUid]);

    // Mapped questions for DraggableQuestionsList
    const mappedQuestions = useMemo(() => {
        return questions.map(mapToCanonicalQuestion);
    }, [questions]);

    // Event handlers
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
    }, []); const handlePlay = useCallback((uid: string, timeLeftMs: number) => {
        // CRITICAL: Use ref to get the ACTUAL current timer state, not React state which can be stale
        const currentTimerState = timerStateRef.current;
        const currentTimerStatus = currentTimerState.status;
        const currentTimerQuestionUid = currentTimerState.questionUid;
        const currentTimeLeftMs = currentTimerState.timeLeftMs;

        logger.info(`Dashboard handlePlay called:`, {
            clickedQuestionUid: uid,
            capturedTimerStatus: currentTimerStatus,
            capturedTimerQuestionUid: currentTimerQuestionUid,
            capturedTimeLeftMs: currentTimeLeftMs,
            isDifferentQuestion: currentTimerQuestionUid !== uid,
            isTimerActive: (currentTimerStatus === 'play' || currentTimerStatus === 'pause'),
            shouldShowConfirmation: (currentTimerStatus === 'play' || currentTimerStatus === 'pause') && currentTimerQuestionUid !== uid
        });

        // Log the actual timer hook values for debugging comparison
        logger.debug(`Timer hook values vs ref at handlePlay:`, {
            hookTimerStatus: timerStatus,
            hookTimerQuestionUid: timerQuestionUid,
            hookTimeLeftMs: timeLeftMs,
            refTimerStatus: currentTimerStatus,
            refTimerQuestionUid: currentTimerQuestionUid,
            refTimeLeftMs: currentTimeLeftMs
        });

        // Check if a DIFFERENT question is already running/paused using ref state (more reliable)
        if ((currentTimerStatus === 'play' || currentTimerStatus === 'pause') && currentTimerQuestionUid !== uid) {
            logger.info(`Dashboard: Showing confirmation dialog for question switch from ${currentTimerQuestionUid} to ${uid}`);
            // Find the index of the question to play
            const playIdx = questions.findIndex(q => q.uid === uid);
            if (playIdx !== -1) {
                logger.info(`Dashboard: Setting confirmation state - showConfirm=true, pendingPlayIdx=${playIdx}`);
                setPendingPlayIdx(playIdx);
                setShowConfirm(true);
                logger.info(`Dashboard: Confirmation dialog state set - showConfirm=${true}, pendingPlayIdx=${playIdx}`);

                // Add a timeout to verify state was set
                setTimeout(() => {
                    logger.info(`Dashboard: Confirmation state check after timeout - showConfirm should be true`);
                }, 100);

                return;
            } else {
                logger.error(`Dashboard: Could not find question with uid ${uid} in questions array`);
            }
        }

        logger.info(`Dashboard: Starting timer directly for ${uid} with ${timeLeftMs}ms (no confirmation needed)`);
        // No confirmation needed - either no timer active, or resuming the same question
        // Select the question and start timer
        handleSelect(uid);
        startTimer(uid, timeLeftMs); // timeLeftMs is already in correct units from SortableQuestion
    }, [questions, startTimer, handleSelect]); // Add handleSelect to dependencies

    const handlePause = useCallback(() => {
        pauseTimer();
    }, [pauseTimer]);

    const handleStop = useCallback(() => {
        stopTimer();
    }, [stopTimer]);

    const handleEditTimer = useCallback((uid: string, newTime: number) => {
        setQuestions(prev => prev.map(q =>
            q.uid === uid ? { ...q, timeLimit: newTime } : q
        ));

        // If this is the active paused timer, restart with new duration
        if (timerQuestionUid === uid && timerStatus === 'pause') {
            startTimer(uid, newTime * 1000);
        }
    }, [timerQuestionUid, timerStatus, startTimer]);

    const handleTimerAction = useCallback((action: { status: 'play' | 'pause' | 'stop', questionUid: string, timeLeftMs: number }) => {
        switch (action.status) {
            case 'play':
                startTimer(action.questionUid, action.timeLeftMs);
                break;
            case 'pause':
                pauseTimer();
                break;
            case 'stop':
                stopTimer();
                break;
        }
    }, [startTimer, pauseTimer, stopTimer]);

    const handleReorder = useCallback((newQuestions: Question[]) => {
        setQuestions(newQuestions);
    }, []);

    const confirmPlay = useCallback(() => {
        logger.info(`Dashboard: confirmPlay called - closing dialog and starting timer`);
        setShowConfirm(false);
        if (pendingPlayIdx !== null && questions[pendingPlayIdx]) {
            const question = questions[pendingPlayIdx];
            logger.info(`Dashboard: Starting timer for confirmed question ${question.uid}`);
            // Select the new question and start timer
            handleSelect(question.uid);
            stopTimer(); // Stop current timer
            startTimer(question.uid, question.timeLimit || 60000); // timeLimit is already in ms from backend
        }
        setPendingPlayIdx(null);
    }, [pendingPlayIdx, questions, handleSelect, stopTimer, startTimer]);

    const cancelPlay = useCallback(() => {
        logger.info(`Dashboard: cancelPlay called - closing dialog without starting timer`);
        setShowConfirm(false);
        setPendingPlayIdx(null);
    }, []);

    // NEW: Handle trophy button (show correct answers and close question)
    const handleShowResults = useCallback((questionUid: string) => {
        if (!quizSocket) {
            logger.warn('Cannot show results: no socket connection');
            return;
        }

        logger.info({ questionUid }, 'Teacher requesting to show correct answers (trophy button)');

        const payload = {
            accessCode: code,
            gameId,
            questionUid,
            teacherId: userProfile?.userId
        };

        quizSocket.emit(SOCKET_EVENTS.TEACHER.SHOW_CORRECT_ANSWERS, payload);

        // Use setTimeout to avoid setState during render
        setTimeout(() => {
            setSnackbarMessage(`Affichage des bonnes réponses pour la question ${questionUid}`);
        }, 0);
    }, [quizSocket, code, gameId, userProfile?.userId]);

    // NEW: Handle bar graph button (toggle stats display on projection)
    const handleStatsToggle = useCallback((questionUid: string, show: boolean) => {
        if (!quizSocket) {
            logger.warn('Cannot toggle stats: no socket connection');
            return;
        }

        logger.info({ questionUid, show }, 'Teacher requesting to toggle projection stats (bar graph button)');

        const payload = {
            accessCode: code,
            gameId,
            questionUid,
            show,
            teacherId: userProfile?.userId
        };

        quizSocket.emit(SOCKET_EVENTS.TEACHER.TOGGLE_PROJECTION_STATS, payload);

        // Use setTimeout to avoid setState during render
        setTimeout(() => {
            const action = show ? 'affichage' : 'masquage';
            setSnackbarMessage(`${action} des statistiques pour la question ${questionUid}`);
        }, 0);
    }, [quizSocket, code, gameId, userProfile?.userId]);

    // End quiz handlers
    const handleEndQuiz = () => {
        setShowEndQuizConfirm(true);
    };

    const confirmEndQuiz = () => {
        setShowEndQuizConfirm(false);
        if (quizSocket && code) {
            const payload: EndGamePayload = { accessCode: code };
            try {
                endGamePayloadSchema.parse(payload);
                quizSocket.emit(SOCKET_EVENTS.TEACHER.END_GAME, payload);
            } catch (error) {
                logger.error('Invalid end_game payload:', error);
            }
        }
    };

    const cancelEndQuiz = () => {
        setShowEndQuizConfirm(false);
    };

    // Render loading/error states
    if (authLoading) return <LoadingScreen message="Vérification de l'authentification..." />;
    if (loading) return <LoadingScreen message="Chargement du tableau de bord..." />;
    if (error) return <div className="p-8 text-red-600">Erreur: {error}</div>;
    if (!code) return <div className="p-8 text-orange-600">Aucun code d'accès fourni.</div>;

    // Check if disabled
    const isDisabled = !quizSocket || !quizSocket.connected || quizState?.ended;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-background border-b border-[color:var(--border)] px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto py-4 sm:py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{quizName}</h1>
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
                                {quizState?.ended ? 'Quiz Terminé' : 'Terminer le quiz'}
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
                            {quizState?.ended ? 'Quiz Terminé' : 'Terminer le quiz'}
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
                            {loading && <InfinitySpin size={32} />}
                        </div>

                        <DraggableQuestionsList
                            quizSocket={quizSocket}
                            questions={mappedQuestions}
                            currentQuestionIdx={quizState?.currentQuestionidx}
                            isChronoRunning={quizState?.chrono?.running}
                            isQuizEnded={quizState?.ended}
                            questionActiveUid={questionActiveUid}
                            timerStatus={timerStatus}
                            timerQuestionUid={timerQuestionUid}
                            timeLeftMs={timeLeftMs}
                            onSelect={handleSelect}
                            onPlay={handlePlay}
                            onPause={handlePause}
                            onStop={handleStop}
                            onEditTimer={handleEditTimer}
                            onReorder={handleReorder}
                            quizId={gameId || ''}
                            currentTournamentCode={code || ''}
                            onTimerAction={handleTimerAction}
                            disabled={isDisabled}
                            expandedUids={expandedUids}
                            onToggleExpand={handleToggleExpand}
                            getStatsForQuestion={(uid: string) => {
                                // Return stats for this question if available
                                const stats = answerStats[uid];
                                if (stats && typeof stats === 'object') {
                                    // Backend now returns percentages directly for each option
                                    // stats is an object like { "0": 25, "1": 75, "2": 0 } for percentages

                                    // Find the question to get the number of answer options
                                    const question = mappedQuestions.find(q => q.uid === uid);
                                    const numOptions = question?.answerOptions?.length || 0;

                                    if (numOptions === 0) {
                                        logger.warn(`Question ${uid} has no answer options`);
                                        return undefined;
                                    }

                                    // Convert to array format, ensuring all options are included
                                    const statsObj = stats as Record<string, number>;
                                    const percentageArray: number[] = [];
                                    for (let i = 0; i < numOptions; i++) {
                                        const percentage = statsObj[i.toString()] || 0; // Backend sends percentages directly
                                        percentageArray.push(percentage);
                                    }

                                    logger.debug(`getStatsForQuestion called for ${uid}:`, stats,
                                        `-> percentages from backend:`, percentageArray);
                                    return percentageArray;
                                }
                                return undefined;
                            }}
                            onShowResults={handleShowResults}
                            onStatsToggle={handleStatsToggle}
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
                title="Terminer le quiz ?"
                message="Êtes-vous sûr de vouloir terminer ce quiz ? Cette action est irréversible."
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