// ...existing code...
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

import { useEffect, useState } from 'react';
import { createLogger } from '@/clientLogger';
import { useSimpleTimer } from './useSimpleTimer';
import { useGameSocket } from './useGameSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import type { Question, TimerStatus } from '@shared/types';
import type { GameState } from '@shared/types/core/game';
import { ProjectionLeaderboardUpdatePayload, ProjectionLeaderboardUpdatePayloadSchema } from '@shared/types/socket/projectionLeaderboardUpdatePayload';

const logger = createLogger('useProjectionQuizSocket');

/**
 * Hook for teacher projection page that displays quiz content
 * Uses modern timer system and joins projection room using shared constants
 */
export function useProjectionQuizSocket(accessCode: string, gameId: string | null) {
    // NEW: Handle canonical game_question event (for question updates)
    const handleGameQuestion = (payload: { question: Question; questionUid: string; questionIndex?: number }) => {
        logger.info('🟢 [PROJECTION] game_question received:', payload);
        setGameState(prev => {
            if (!prev) return prev;
            let idx = payload.questionIndex;
            if (typeof idx !== 'number' && Array.isArray(prev.questionUids)) {
                idx = prev.questionUids.findIndex((uid: string) => uid === payload.questionUid);
            }
            // If questionData is an array, update the correct index; otherwise, set as single question
            let newQuestionData: any = prev.questionData;
            if (Array.isArray(prev.questionData) && typeof idx === 'number' && idx >= 0) {
                newQuestionData = [...prev.questionData];
                newQuestionData[idx] = payload.question;
            } else {
                newQuestionData = payload.question;
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
    }>>([]);

    // NEW: Projection display state
    const [showStats, setShowStats] = useState<boolean>(false);
    const [currentStats, setCurrentStats] = useState<Record<string, number>>({});
    const [showCorrectAnswers, setShowCorrectAnswers] = useState<boolean>(false);
    const [correctAnswersData, setCorrectAnswersData] = useState<{
        questionUid: string;
        correctAnswers: boolean[];
        questionText?: string;
        answerOptions?: string[];
    } | null>(null);

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
        const handleQuestionChanged = (payload: { question: Question; questionUid: string; questionIndex?: number; timer?: any }) => {
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
            setLeaderboard(processedLeaderboard);
            logger.info({
                leaderboardCount: processedLeaderboard.length,
                topScores: processedLeaderboard.slice(0, 5).map(p => ({ username: p.username, score: p.score }))
            }, '✅ [PROJECTION-FRONTEND] Updated projection leaderboard state');
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

                    setLeaderboard(payload.leaderboard.map((entry: any) => ({
                        userId: entry.userId,
                        username: entry.username || 'Unknown Player',
                        avatarEmoji: entry.avatarEmoji,
                        score: entry.score || 0
                    })));
                    logger.info(`🎯 Initialized projection leaderboard with ${payload.leaderboard.length} students from initial state`);
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
        const handleProjectionShowStats = (payload: { questionUid: string; stats: Record<string, number>; timestamp?: number }) => {
            console.log('🔥🔥🔥 [PROJECTION HOOK] RECEIVED SHOW STATS EVENT!');
            console.log('📊 Payload:', payload);
            console.log('🔥🔥🔥 Setting showStats to TRUE and updating currentStats');

            logger.info('📊 [PROJECTION-FRONTEND] Show stats request received:', payload);
            setCurrentStats(payload.stats || {});
            setShowStats(true);

            console.log('✅ Stats state updated successfully');
        };

        const handleProjectionHideStats = (payload: { questionUid: string; timestamp?: number }) => {
            console.log('🔥🔥🔥 [PROJECTION HOOK] RECEIVED HIDE STATS EVENT!');
            console.log('📊 Payload:', payload);
            console.log('🔥🔥🔥 Setting showStats to FALSE');

            logger.info('📊 [PROJECTION-FRONTEND] Hide stats request received:', payload);
            setShowStats(false);
            setCurrentStats({});

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

            // Optional: Auto-hide after some time
            setTimeout(() => {
                setShowCorrectAnswers(false);
                setCorrectAnswersData(null);
            }, 15000); // Hide after 15 seconds
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
        (socket.socket as any).on('game_question', handleGameQuestion);

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

    // Return clean interface using canonical types only

    // Derive currentQuestion from gameState and current index
    let currentQuestion: Question | null = null;
    if (gameState && Array.isArray(gameState.questionData) && typeof gameState.currentQuestionIndex === 'number') {
        currentQuestion = gameState.questionData[gameState.currentQuestionIndex] || null;
    } else if (gameState && gameState.questionData && !Array.isArray(gameState.questionData)) {
        // Fallback for single-question gameState
        currentQuestion = gameState.questionData;
    }

    const returnValue = {
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

        // NEW: Projection display state
        showStats,
        currentStats,
        showCorrectAnswers,
        correctAnswersData,

        // Canonical timer state (per-question)
        timerStates: timer.timerStates,
        getTimerState: timer.getTimerState,

        // Canonical timer state (per-question)
        timerStatus: timerState?.status,
        timerQuestionUid: timerQuestionUid,
        timeLeftMs: timerState?.timeLeftMs,

        // Socket error for auth handling (DRY principle)
        socketError,

        // Socket reference (if needed for advanced usage)
        socket: socket.socket
    };

    // Debug logging to see what we're returning
    console.log('🚀 [HOOK] PROJECTION STATE VALUES:', {
        showStats,
        currentStats,
        showCorrectAnswers,
        correctAnswersData
    });

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

    return returnValue;
}
