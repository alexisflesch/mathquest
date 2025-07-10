/**
 * Projection Quiz Socket Hook
 * 
 * Modernized hook for teacher projection display using canonical shared types
 * and the modern useSimpleTimer hook. Follows modernization guidelines from .instructions.md.
 * 
 * Key modernization principles:
 * - Uses SOCKET_EVENTS shared constants (no hardcoded event names)
 * - Uses canonical shared types from @shared/types
 * - Uses modern useSimpleTimer hook
 * - Clean room separation with projection_${gameId} pattern
 * - Zod validation for socket payloads
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { createLogger } from '@/clientLogger';
import { useSimpleTimer } from './useSimpleTimer';
import { useGameSocket } from './useGameSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import type { TimerStatus } from '@shared/types';
import { questionDataForStudentSchema } from '@shared/types/socketEvents.zod';
import type { z } from 'zod';
type QuestionDataForStudent = z.infer<typeof questionDataForStudentSchema>;
import type { GameState } from '@shared/types/core/game';
import { ProjectionLeaderboardUpdatePayload, ProjectionLeaderboardUpdatePayloadSchema } from '@shared/types/socket/projectionLeaderboardUpdatePayload';
import { ProjectionShowStatsPayload, ProjectionShowStatsPayloadSchema } from '@shared/types/socket/projectionShowStats';

const logger = createLogger('useProjectionQuizSocket');

// Stable empty objects to prevent unnecessary re-renders
const EMPTY_STATS: Record<string, number> = {};
const EMPTY_LEADERBOARD: Array<{ userId: string; username: string; avatarEmoji?: string; score: number }> = [];

/**
 * Hook for teacher projection page that displays quiz content
 * Uses modern timer system and joins projection room using shared constants
 */
export function useProjectionQuizSocket(accessCode: string, gameId: string | null) {
    // NEW: Handle canonical game_question event (for question updates)
    const handleGameQuestion = (payload: QuestionDataForStudent) => {
        logger.info('🟢 [PROJECTION] game_question received:', payload);
        // Validate with Zod
        const parseResult = questionDataForStudentSchema.safeParse(payload);
        if (!parseResult.success) {
            logger.error({ errors: parseResult.error.errors, payload }, '[PROJECTION] Invalid GAME_QUESTION payload received');
            return;
        }
        setGameState(prev => {
            if (!prev) return prev;
            let idx = payload.currentQuestionIndex;
            if (typeof idx !== 'number' && Array.isArray(prev.questionUids)) {
                idx = prev.questionUids.findIndex((uid: string) => uid === payload.uid);
            }
            let newQuestionData: any = prev.questionData;
            if (Array.isArray(prev.questionData) && typeof idx === 'number' && idx >= 0) {
                newQuestionData = [...prev.questionData];
                newQuestionData[idx] = payload;
            } else {
                newQuestionData = payload;
            }
            return {
                ...prev,
                currentQuestionIndex: typeof idx === 'number' && idx >= 0 ? idx : prev.currentQuestionIndex,
                questionData: newQuestionData
            };
        });
    };
    // Use modern game socket with correct role and gameId
    const socket = useGameSocket('projection', gameId);

    // Use canonical GameState from backend response
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [connectedCount, setConnectedCount] = useState<number>(0);
    const [leaderboard, setLeaderboard] = useState<Array<{
        userId: string;
        username: string;
        avatarEmoji?: string;
        score: number;
    }>>(EMPTY_LEADERBOARD);
    // Track when a leaderboard update is received from the backend
    const [leaderboardUpdateTrigger, setLeaderboardUpdateTrigger] = useState(0);

    // NEW: Projection display state
    const [showStats, setShowStats] = useState<boolean>(false);
    const [currentStats, setCurrentStats] = useState<Record<string, number>>(EMPTY_STATS);
    const [showCorrectAnswers, setShowCorrectAnswers] = useState<boolean>(false);
    const [correctAnswersData, setCorrectAnswersData] = useState<{
        questionUid: string;
        correctAnswers: boolean[];
        questionText?: string;
        answerOptions?: string[];
    } | null>(null);

    // NEW: Listen for initial stats state from backend (always sent on join)
    useEffect(() => {
        if (!socket.socket) return;
        const handleInitialStatsState = (payload: { showStats: boolean; currentStats: Record<string, number>; statsQuestionUid: string | null; timestamp?: number }) => {
            console.log('🟢 [PROJECTION] Received PROJECTION_STATS_STATE:', payload);
            setShowStats(!!payload.showStats);
            setCurrentStats(payload.currentStats || EMPTY_STATS);
        };
        (socket.socket as any).on(SOCKET_EVENTS.PROJECTOR.PROJECTION_STATS_STATE, handleInitialStatsState);
        return () => {
            (socket.socket as any)?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_STATS_STATE, handleInitialStatsState);
        };
    }, [socket.socket]);

    // Error state that page can handle
    const [socketError, setSocketError] = useState<any>(null);

    // Use modern timer with projection role
    const timer = useSimpleTimer({
        gameId: gameId || undefined,
        accessCode,
        socket: socket.socket,
        role: 'projection'
    });

    // Canonical: get timer state for the current question (projection)
    let timerQuestionUid: string | null = null;
    if (gameState && typeof gameState.currentQuestionIndex === 'number' && Array.isArray(gameState.questionUids)) {
        timerQuestionUid = gameState.questionUids[gameState.currentQuestionIndex] || null;
    }
    const timerState = timerQuestionUid ? timer.getTimerState(timerQuestionUid) : undefined;

    // Optimize timer updates: only update when display value changes (every second, not every 100ms)
    const [optimizedTimeLeftMs, setOptimizedTimeLeftMs] = useState<number | undefined>(timerState?.timeLeftMs);
    const [optimizedTimerStatus, setOptimizedTimerStatus] = useState<TimerStatus | undefined>(timerState?.status);
    const lastTimeLeftMsRef = useRef<number | undefined>(timerState?.timeLeftMs);
    const lastTimerStatusRef = useRef<TimerStatus | undefined>(timerState?.status);

    // Extract just the timeLeftMs and status values to avoid dependency on the entire timerState object
    const currentTimeLeftMs = timerState?.timeLeftMs;
    const currentTimerStatus = timerState?.status;

    useEffect(() => {
        let shouldUpdateTimeLeft = false;
        let shouldUpdateStatus = false;

        // Check if timer status changed
        if (currentTimerStatus !== lastTimerStatusRef.current) {
            console.log('🔍 [TIMER DEBUG] Status changed:', lastTimerStatusRef.current, '->', currentTimerStatus);
            lastTimerStatusRef.current = currentTimerStatus;
            shouldUpdateStatus = true;
        }

        // Check if time left changed meaningfully
        if (currentTimeLeftMs !== lastTimeLeftMsRef.current) {
            lastTimeLeftMsRef.current = currentTimeLeftMs;

            if (currentTimeLeftMs === null || currentTimeLeftMs === undefined) {
                shouldUpdateTimeLeft = true;
            } else {
                const newDisplaySeconds = Math.floor(currentTimeLeftMs / 1000);
                const currentDisplaySeconds = optimizedTimeLeftMs ? Math.floor(optimizedTimeLeftMs / 1000) : -1;

                // Only update if the displayed seconds value has changed
                if (newDisplaySeconds !== currentDisplaySeconds) {
                    console.log('🔍 [TIMER DEBUG] Display seconds changed:', currentDisplaySeconds, '->', newDisplaySeconds);
                    shouldUpdateTimeLeft = true;
                }
            }
        }

        // Update states only if needed
        if (shouldUpdateTimeLeft) {
            setOptimizedTimeLeftMs(currentTimeLeftMs);
        }
        if (shouldUpdateStatus) {
            setOptimizedTimerStatus(currentTimerStatus);
        }
    }, [currentTimeLeftMs, currentTimerStatus]); // Only depend on extracted values

    // Join projection room when socket connects
    useEffect(() => {
        if (!socket.socket || !gameId) return;

        const joinProjection = () => {
            if (!gameId) {
                logger.warn('🚫 [PROJECTION-FRONTEND] Cannot join projection: no gameId provided');
                return;
            }

            logger.info('🎬 [PROJECTION-FRONTEND] Joining projection room for game:', {
                gameId,
                accessCode,
                socketId: socket.socket?.id,
                socketConnected: socket.socket?.connected
            });

            logger.debug('📡 [PROJECTION-FRONTEND] Emitting join event with payload:', {
                gameId,
                eventName: SOCKET_EVENTS.PROJECTOR.JOIN_PROJECTION,
                expectedProjectionRoom: `projection_${gameId}`
            });

            // Use shared constant for join event (temporary raw emit until types are updated)
            (socket.socket as any)?.emit(SOCKET_EVENTS.PROJECTOR.JOIN_PROJECTION, { gameId });
        };

        // Join immediately if already connected
        if (socket.socket.connected) {
            joinProjection();
        }

        // Listen for connection events
        const handleConnect = () => {
            logger.info('🔌 [PROJECTION] Socket connected:', socket.socket?.id);
            joinProjection();
        };

        const handleDisconnect = () => {
            logger.warn('🔌 [PROJECTION] Socket disconnected');
            // Reset state on disconnect - maintain required properties
            setGameState(prev => prev ? ({
                ...prev,
                locked: false,
                connectedSockets: new Set()
            }) : null);
        };

        // Listen for projection join success
        const handleProjectionJoined = (payload: any) => {
            logger.info('✅ [PROJECTION-FRONTEND] Successfully joined projection room:', {
                payload,
                gameId,
                accessCode
            });
            logger.debug('🎯 [PROJECTION-FRONTEND] Projection room joined, should receive timer and leaderboard events now');
        };

        // Listen for projection errors
        const handleProjectionError = (payload: any) => {
            logger.error('❌ [PROJECTION-FRONTEND] Error joining projection room:', {
                payload,
                gameId,
                accessCode
            });
            // Expose error to component via state
            setSocketError(payload);
        };

        socket.socket.on('connect', handleConnect);
        socket.socket.on('disconnect', handleDisconnect);
        (socket.socket as any).on(SOCKET_EVENTS.PROJECTOR.PROJECTION_JOINED, handleProjectionJoined);
        (socket.socket as any).on(SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, handleProjectionError);

        return () => {
            socket.socket?.off('connect', handleConnect);
            socket.socket?.off('disconnect', handleDisconnect);
            (socket.socket as any)?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_JOINED, handleProjectionJoined);
            (socket.socket as any)?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, handleProjectionError);

            // Leave projection room on cleanup
            if (gameId) {
                (socket.socket as any)?.emit(SOCKET_EVENTS.PROJECTOR.LEAVE_PROJECTION, { gameId });
            }
        };
    }, [socket.socket, gameId]);

    // Listen for projection-specific game events using shared constants
    useEffect(() => {
        if (!socket.socket) return;

        // Handle question changes from teacher dashboard (timer updates will come through timer system)
        // LEGACY: Remove usage of Question type, use canonical type or remove if not needed
        const handleQuestionChanged = (payload: { question: any; questionUid: string; questionIndex?: number; timer?: any }) => {
            logger.info('📋 Projection question changed:', payload);
            setGameState(prev => {
                if (!prev) return prev;
                let idx = payload.questionIndex;
                if (typeof idx !== 'number' && Array.isArray(prev.questionUids)) {
                    idx = prev.questionUids.findIndex(uid => uid === payload.questionUid);
                }
                return {
                    ...prev,
                    currentQuestionIndex: typeof idx === 'number' && idx >= 0 ? idx : prev.currentQuestionIndex,
                    questionData: payload.question,
                    timer: payload.timer ? payload.timer : prev.timer
                };
            });
        };

        // NEW: Handle dashboard_timer_updated event to update timer and question index
        const handleDashboardTimerUpdated = (payload: { timer: any; questionUid: string; questionIndex: number; totalQuestions: number; answersLocked: boolean }) => {
            logger.info('⏰ [PROJECTION] dashboard_timer_updated received:', payload);
            setGameState(prev => {
                if (!prev) return prev;
                const newIndex = typeof payload.questionIndex === 'number' ? payload.questionIndex : prev.currentQuestionIndex;
                let newQuestionData = prev.questionData;
                // If questionData is an array (canonical), update to the new question at the index
                if (Array.isArray(prev.questionData) && typeof newIndex === 'number') {
                    newQuestionData = prev.questionData[newIndex] || null;
                }
                return {
                    ...prev,
                    currentQuestionIndex: newIndex,
                    timer: payload.timer ? payload.timer : prev.timer,
                    questionData: newQuestionData
                };
            });
        };

        // Handle connected participant count updates
        const handleConnectedCount = (payload: { count: number }) => {
            logger.debug('👥 Connected count update:', payload.count);
            setConnectedCount(payload.count);
        };

        // Handle leaderboard updates when students join (UX enhancement for teacher projection)
        const handleLeaderboardUpdate = (payload: ProjectionLeaderboardUpdatePayload) => {
            // DEBUG: Log raw leaderboard update event
            console.log('🟡 [PROJECTION] Received PROJECTION_LEADERBOARD_UPDATE event:', payload);
            logger.info('🟡 [PROJECTION] Received PROJECTION_LEADERBOARD_UPDATE event:', payload);
            // Validate with Zod
            const parseResult = ProjectionLeaderboardUpdatePayloadSchema.safeParse(payload);
            if (!parseResult.success) {
                logger.warn('⚠️ [PROJECTION-FRONTEND] Invalid leaderboard payload received:', parseResult.error.issues);
                return;
            }
            logger.info('🏆 [PROJECTION-FRONTEND] Leaderboard update received:', {
                hasLeaderboard: !!payload.leaderboard,
                leaderboardLength: payload.leaderboard?.length || 0,
                topPlayers: payload.leaderboard?.slice(0, 3).map((p) => ({ username: p.username, score: p.score })) || []
            });
            const processedLeaderboard = payload.leaderboard.map((entry) => ({
                userId: entry.userId,
                username: entry.username || 'Unknown Player',
                avatarEmoji: entry.avatarEmoji,
                score: entry.score || 0
            }));


            // Log both arrays for debugging
            setLeaderboard(prevLeaderboard => {
                logger.debug('[LEADERBOARD DIFF DEBUG] prevLeaderboard:', JSON.stringify(prevLeaderboard));
                logger.debug('[LEADERBOARD DIFF DEBUG] processedLeaderboard:', JSON.stringify(processedLeaderboard));

                // Compare lengths first (quick check)
                if (prevLeaderboard.length !== processedLeaderboard.length) {
                    logger.info('🔄 [PROJECTION-FRONTEND] Leaderboard length changed, updating state');
                    setLeaderboardUpdateTrigger(t => t + 1); // Mark as new leaderboard update
                    return processedLeaderboard;
                }

                // Compare each entry
                const hasChanged = processedLeaderboard.some((newEntry, index) => {
                    const prevEntry = prevLeaderboard[index];
                    return !prevEntry ||
                        prevEntry.userId !== newEntry.userId ||
                        prevEntry.username !== newEntry.username ||
                        prevEntry.avatarEmoji !== newEntry.avatarEmoji ||
                        prevEntry.score !== newEntry.score;
                });

                if (hasChanged) {
                    logger.info('🔄 [PROJECTION-FRONTEND] Leaderboard data changed, updating state');
                    setLeaderboardUpdateTrigger(t => t + 1); // Mark as new leaderboard update
                    return processedLeaderboard;
                } else {
                    logger.debug('⏸️ [PROJECTION-FRONTEND] Leaderboard data unchanged, skipping update');
                    return prevLeaderboard; // Return previous state to prevent re-render
                }
            });

            logger.info({
                leaderboardCount: processedLeaderboard.length,
                topScores: processedLeaderboard.slice(0, 5).map(p => ({ username: p.username, score: p.score }))
            }, '✅ [PROJECTION-FRONTEND] Processed projection leaderboard update');
        };        // Handle game state updates (including initial state from getFullGameState)
        const handleGameStateUpdate = (payload: any) => {
            logger.info('🎮 Game state update received:', payload);

            // If this is a full state update from getFullGameState (has gameState property)
            if (payload.gameState) {
                // Hydrate timer state from canonical timer if present
                if (payload.gameState.timer) {
                    timer.hydrateTimerState(payload.gameState.timer);
                }

                // Ensure currentQuestionIndex matches timer.questionUid if possible
                let newGameState = { ...payload.gameState };
                if (
                    payload.gameState.timer &&
                    payload.gameState.timer.questionUid &&
                    Array.isArray(payload.gameState.questionUids)
                ) {
                    const idx = payload.gameState.questionUids.findIndex(
                        (uid: string) => uid === payload.gameState.timer.questionUid
                    );
                    if (idx !== -1 && newGameState.currentQuestionIndex !== idx) {
                        newGameState.currentQuestionIndex = idx;
                    }
                }
                setGameState(newGameState);
                logger.info('✅ Full projection state initialized from backend');

                // Handle initial leaderboard data if present
                if (payload.leaderboard && Array.isArray(payload.leaderboard)) {
                    // Add detailed logging to debug username issues
                    payload.leaderboard.forEach((entry: any, index: number) => {
                        logger.debug({
                            index,
                            entry,
                            username: entry.username,
                            usernameType: typeof entry.username,
                            usernameLength: entry.username?.length,
                            isTruthy: !!entry.username,
                            fallbackWillTrigger: !entry.username
                        }, '🔍 [FRONTEND-DEBUG-INITIAL] Processing initial leaderboard entry for username');
                    });

                    const initialLeaderboard = payload.leaderboard.map((entry: any) => ({
                        userId: entry.userId,
                        username: entry.username || 'Unknown Player',
                        avatarEmoji: entry.avatarEmoji,
                        score: entry.score || 0
                    }));

                    // Only update if data is different (initial state comparison)
                    setLeaderboard(prevLeaderboard => {
                        // On initial load, prevLeaderboard will be empty array
                        if (prevLeaderboard.length === 0 && initialLeaderboard.length > 0) {
                            logger.info(`🎯 Initializing projection leaderboard with ${initialLeaderboard.length} students from initial state`);
                            return initialLeaderboard;
                        }

                        // Compare if already has data
                        if (prevLeaderboard.length !== initialLeaderboard.length) {
                            logger.info('🔄 [PROJECTION-FRONTEND] Initial leaderboard length changed, updating state');
                            return initialLeaderboard;
                        }

                        const hasChanged = initialLeaderboard.some((newEntry: any, index: number) => {
                            const prevEntry = prevLeaderboard[index];
                            return !prevEntry ||
                                prevEntry.userId !== newEntry.userId ||
                                prevEntry.username !== newEntry.username ||
                                prevEntry.avatarEmoji !== newEntry.avatarEmoji ||
                                prevEntry.score !== newEntry.score;
                        });

                        if (hasChanged) {
                            logger.info('🔄 [PROJECTION-FRONTEND] Initial leaderboard data changed, updating state');
                            return initialLeaderboard;
                        } else {
                            logger.debug('⏸️ [PROJECTION-FRONTEND] Initial leaderboard data unchanged, skipping update');
                            return prevLeaderboard;
                        }
                    });
                }

                // Debug: log the timer and question details
                logger.debug('🔍 [DEBUG] Timer state:', {
                    timerStatus: payload.gameState.timer?.status,
                    timerQuestionUid: payload.gameState.timer?.questionUid,
                    questionData: payload.gameState.questionData,
                    questionUids: payload.gameState.questionUids
                });

                return;
            }

            // Handle partial updates (legacy compatibility)
            if (payload.status) {
                setGameState(prev => prev ? ({
                    ...prev,
                    status: payload.status
                }) : null);
            }

            if (payload.answersLocked !== undefined) {
                setGameState(prev => prev ? ({
                    ...prev,
                    answersLocked: payload.answersLocked
                }) : null);
            }
        };

        // NEW: Handle projection stats show/hide
        // Modernized: Handle show/hide stats in a single handler, respecting payload.show
        const handleProjectionShowStats = (payload: ProjectionShowStatsPayload) => {
            // Runtime validation
            const parseResult = ProjectionShowStatsPayloadSchema.safeParse(payload);
            if (!parseResult.success) {
                console.error('[PROJECTION HOOK] Invalid PROJECTION_SHOW_STATS payload:', parseResult.error.errors, payload);
                logger.error('[PROJECTION-FRONTEND] Invalid PROJECTION_SHOW_STATS payload:', parseResult.error.errors, payload);
                return;
            }
            if (payload.show) {
                logger.info('📊 [PROJECTION-FRONTEND] Show stats request received (show=TRUE):', payload);
                setCurrentStats(payload.stats || EMPTY_STATS);
                setShowStats(true);
            } else {
                logger.info('📊 [PROJECTION-FRONTEND] Hide stats request received (show=FALSE):', payload);
                setShowStats(false);
                setCurrentStats(EMPTY_STATS);
            }
        };

        const handleProjectionHideStats = (payload: { questionUid: string; timestamp?: number }) => {
            console.log('🔥🔥🔥 [PROJECTION HOOK] RECEIVED HIDE STATS EVENT!');
            console.log('📊 Payload:', payload);
            console.log('🔥🔥🔥 Setting showStats to FALSE');

            logger.info('📊 [PROJECTION-FRONTEND] Hide stats request received:', payload);
            setShowStats(false);
            setCurrentStats(EMPTY_STATS);

            console.log('✅ Stats hidden successfully');
        };

        // NEW: Handle projection correct answers display
        const handleProjectionCorrectAnswers = (payload: {
            questionUid: string;
            correctAnswers: boolean[];
            questionText?: string;
            answerOptions?: string[];
            timestamp?: number;
        }) => {
            logger.info('🏆 [PROJECTION-FRONTEND] Show correct answers request received:', payload);
            setCorrectAnswersData({
                questionUid: payload.questionUid,
                correctAnswers: payload.correctAnswers,
                questionText: payload.questionText,
                answerOptions: payload.answerOptions
            });
            setShowCorrectAnswers(true);
        };

        // Hide correct answers when a new question arrives
        const handleGameQuestionWithReset = (payload: QuestionDataForStudent) => {
            setShowCorrectAnswers(false);
            setCorrectAnswersData(null);
            handleGameQuestion(payload);
        };

        // Listen to projection events using shared constants (with type casting until types are updated)
        logger.debug('🎧 [PROJECTION-FRONTEND] Setting up projection event listeners:', {
            events: [
                SOCKET_EVENTS.PROJECTOR.PROJECTION_QUESTION_CHANGED,
                SOCKET_EVENTS.PROJECTOR.PROJECTION_CONNECTED_COUNT,
                SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE,
                SOCKET_EVENTS.PROJECTOR.PROJECTION_LEADERBOARD_UPDATE,
                SOCKET_EVENTS.PROJECTOR.PROJECTION_SHOW_STATS,
                SOCKET_EVENTS.PROJECTOR.PROJECTION_HIDE_STATS,
                SOCKET_EVENTS.PROJECTOR.PROJECTION_CORRECT_ANSWERS
            ]
        });

        (socket.socket as any).on(SOCKET_EVENTS.PROJECTOR.PROJECTION_QUESTION_CHANGED, handleQuestionChanged);
        (socket.socket as any).on('dashboard_timer_updated', handleDashboardTimerUpdated);
        (socket.socket as any).on(SOCKET_EVENTS.PROJECTOR.PROJECTION_CONNECTED_COUNT, handleConnectedCount);
        (socket.socket as any).on(SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE, handleGameStateUpdate);
        (socket.socket as any).on(SOCKET_EVENTS.PROJECTOR.PROJECTION_LEADERBOARD_UPDATE, handleLeaderboardUpdate);
        // Listen for canonical game_question event
        (socket.socket as any).on('game_question', handleGameQuestionWithReset);

        // NEW: Listen to projection display control events
        (socket.socket as any).on(SOCKET_EVENTS.PROJECTOR.PROJECTION_SHOW_STATS, handleProjectionShowStats);
        (socket.socket as any).on(SOCKET_EVENTS.PROJECTOR.PROJECTION_HIDE_STATS, handleProjectionHideStats);
        (socket.socket as any).on(SOCKET_EVENTS.PROJECTOR.PROJECTION_CORRECT_ANSWERS, handleProjectionCorrectAnswers);

        // DEBUG: Add a catch-all listener to see what events are being received
        const handleAnyEvent = (eventName: string, ...args: any[]) => {
            if (eventName.includes('projection') || eventName.includes('stats')) {
                console.log('🔍🔍🔍 [DEBUG-PROJECTION] Event received:', { eventName, args });
                logger.info('🔍 [DEBUG-PROJECTION] Event received:', { eventName, args });
            }
        };

        // Listen for all events for debugging
        (socket.socket as any).onAny?.(handleAnyEvent);

        // DEBUG: Add global event listener to log all received events and their payloads
        const handleAllSocketEvents = (...args: any[]) => {
            const eventName = args[0];
            const payload = args.slice(1);
            // Only log if eventName is a string (Socket.IO v4+ passes event name as first arg)
            if (typeof eventName === 'string') {
                console.log('🟢 [SOCKET-ALL] Event received:', eventName, ...payload);
                logger.info('🟢 [SOCKET-ALL] Event received:', { eventName, payload });
            } else {
                // Fallback for older Socket.IO versions
                console.log('🟢 [SOCKET-ALL] Event received (no eventName):', ...args);
                logger.info('🟢 [SOCKET-ALL] Event received (no eventName):', { args });
            }
        };
        (socket.socket as any).onAny?.(handleAllSocketEvents);

        return () => {
            (socket.socket as any)?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_QUESTION_CHANGED, handleQuestionChanged);
            (socket.socket as any)?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_CONNECTED_COUNT, handleConnectedCount);
            (socket.socket as any)?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE, handleGameStateUpdate);
            (socket.socket as any)?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_LEADERBOARD_UPDATE, handleLeaderboardUpdate);
            (socket.socket as any)?.off('game_question', handleGameQuestion);

            // NEW: Clean up projection display event listeners
            (socket.socket as any)?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_SHOW_STATS, handleProjectionShowStats);
            (socket.socket as any)?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_HIDE_STATS, handleProjectionHideStats);
            (socket.socket as any)?.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_CORRECT_ANSWERS, handleProjectionCorrectAnswers);

            (socket.socket as any)?.offAny?.(handleAnyEvent);
            (socket.socket as any)?.off('projection_show_stats');
            (socket.socket as any)?.off('projection_hide_stats');
            (socket.socket as any)?.offAny?.(handleAllSocketEvents);
        };
    }, [socket.socket]);

    // Memoize currentStats to prevent unnecessary re-renders when object content hasn't changed
    const memoizedCurrentStats = useMemo(() => {
        if (Object.keys(currentStats).length === 0) {
            return EMPTY_STATS;
        }
        return currentStats;
    }, [currentStats]);

    // Return clean interface using canonical types only

    // Derive currentQuestion from gameState and current index
    let currentQuestion: any = null;
    if (gameState && Array.isArray(gameState.questionData) && typeof gameState.currentQuestionIndex === 'number') {
        currentQuestion = gameState.questionData[gameState.currentQuestionIndex] || null;
    } else if (gameState && gameState.questionData && !Array.isArray(gameState.questionData)) {
        // Fallback for single-question gameState
        currentQuestion = gameState.questionData;
    }

    const returnValue = useMemo(() => {
        return {
            // Socket connection status
            isConnected: socket.socketState.connected,

            // Game state using canonical types
            gameState,
            currentQuestion,
            currentQuestionUid: timerQuestionUid, // Use timer's questionUid only
            connectedCount,
            gameStatus: gameState?.status ?? 'pending',
            isAnswersLocked: gameState?.answersLocked ?? false,

            // Leaderboard data for projection display (UX enhancement)
            leaderboard,
            leaderboardUpdateTrigger,

            // NEW: Projection display state
            showStats,
            currentStats: memoizedCurrentStats,
            showCorrectAnswers,
            correctAnswersData,

            // Canonical timer state (per-question) - ONLY optimized values
            timerStatus: optimizedTimerStatus,
            timerQuestionUid: timerQuestionUid,
            timeLeftMs: optimizedTimeLeftMs,

            // Socket error for auth handling (DRY principle)
            socketError,

            // Socket reference (if needed for advanced usage)
            socket: socket.socket
        };
    }, [
        // MINIMAL DEPS: Only include values that should trigger re-renders when they actually change display
        socket.socketState.connected,
        gameState?.status,
        gameState?.currentQuestionIndex,
        gameState?.answersLocked,
        timerQuestionUid,
        connectedCount,
        leaderboard?.length, // Only re-render if count changes
        leaderboardUpdateTrigger,
        showStats,
        showCorrectAnswers,
        correctAnswersData?.questionUid, // Only if question changes
        optimizedTimerStatus, // Use optimized status instead of timerState?.status
        optimizedTimeLeftMs, // This only changes when display seconds change
        socketError?.message
    ]);

    // Debug logging to see what we're returning
    // console.log('🚀 [HOOK] PROJECTION STATE VALUES:', {
    //     showStats,
    //     currentStats,
    //     showCorrectAnswers,
    //     correctAnswersData
    // });

    /*
    logger.debug('🔍 useProjectionQuizSocket returning:', {
        hasGameState: !!returnValue.gameState,
        gameStateKeys: returnValue.gameState ? Object.keys(returnValue.gameState) : null,
        connectedCount: returnValue.connectedCount,
        leaderboardCount: returnValue.leaderboard.length,
        gameStatus: returnValue.gameStatus,
        isConnected: returnValue.isConnected,
        // NEW: Include projection display state in debug logs
        showStats: returnValue.showStats,
        currentStats: returnValue.currentStats,
        showCorrectAnswers: returnValue.showCorrectAnswers,
        hasCorrectAnswersData: !!returnValue.correctAnswersData,
        hasCurrentStats: Object.keys(returnValue.currentStats).length > 0,
        timerValues: {
            canonicalTimerState: timerState,
            finalTimeLeft: returnValue.timeLeftMs,
            finalStatus: returnValue.timerStatus
        }
    });
    */

    return returnValue;
}
