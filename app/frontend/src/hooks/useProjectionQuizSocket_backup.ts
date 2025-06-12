import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { STORAGE_KEYS } from '@/constants/auth';
import { useProjectionTimer } from './useGameTimer';

// Import core types
import type {
    TimerUpdatePayload,
    GameTimerUpdatePayload,
    TimerStatus
} from '@shared/types/core';

import type {
    ErrorPayload,
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData
} from '@shared/types/socketEvents';
import {
    createSafeEventHandler,
    type ProjectorState,
    type ProjectorJoinedRoomPayload,
    type ProjectorConnectedCountPayload,
    type ProjectorTimerUpdatePayload,
    isProjectorState,
    isProjectorJoinedRoomPayload,
    isProjectorConnectedCountPayload,
    isProjectorTimerUpdatePayload
} from '@/types/socketTypeGuards';

const logger = createLogger('useProjectionQuizSocket');

export function useProjectionQuizSocket(gameId: string | null, tournamentCode: string | null) {
    const [gameSocket, setGameSocket] = useState<Socket | null>(null);
    const [gameState, setGameState] = useState<ProjectorState | null>(null);
    const [connectedCount, setConnectedCount] = useState<number>(1);

    // Use unified timer system for projection display with smooth animations
    const gameTimer = useProjectionTimer(gameSocket, {
        autoStart: false,
        smoothCountdown: true,
        showMilliseconds: false,
        enableLocalAnimation: true,
        updateThreshold: 200 // 200ms threshold for UI updates
    });

    // Legacy timer state for backward compatibility - keep in milliseconds internally
    const timerStatus = gameTimer.timerState.status;
    const timerQuestionUid = gameTimer.timerState.questionUid || null;
    const timeLeftMs = gameTimer.timerState.timeLeftMs; // Keep in milliseconds
    const localTimeLeftMs = gameTimer.timerState.localTimeLeftMs; // Keep in milliseconds

    useEffect(() => {
        if (!gameId) return;
        logger.info(`Initializing socket connection for projection: ${gameId} to ${SOCKET_CONFIG.url}`);
        // Connect to backend using complete centralized configuration
        const s = io(SOCKET_CONFIG.url, SOCKET_CONFIG);
        setGameSocket(s);
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.TEACHER_ID) : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.COOKIE_ID) : null;
        logger.info(`[DEBUG][CLIENT] Emitting join_projector for gameId=${gameId}, teacherId=${teacherId}, cookie_id=${cookie_id}`);
        s.emit(SOCKET_EVENTS.PROJECTOR.JOIN_PROJECTOR, gameId);
        s.on(SOCKET_EVENTS.CONNECT, () => {
            logger.info(`Socket connected: ${s.id}`);
            // Note: The initial state is sent automatically upon joining the projector room
        });
        s.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
            logger.warn(`Socket disconnected: ${reason}`);
            setGameState(null);
            // Reset timer through unified system
            gameTimer.stop();
        });
        s.on(SOCKET_EVENTS.CONNECT_ERROR, (err) => {
            logger.error("Socket connection error:", err);
        });
        s.on(SOCKET_EVENTS.PROJECTOR.JOINED_ROOM, createSafeEventHandler(
            ({ room, socketId }: ProjectorJoinedRoomPayload) => {
                logger.debug("Server confirms join", { room, socketId });
            },
            isProjectorJoinedRoomPayload,
            'PROJECTOR.JOINED_ROOM'
        ));
        s.onAny((event, ...args) => {
            logger.debug(`Socket event received: ${event}`, args);
        });
        return () => {
            logger.info(`Disconnecting socket for projection: ${gameId}`);
            s.disconnect();
            setGameSocket(null);
        };
    }, [gameId]);

    useEffect(() => {
        if (!gameSocket) return;
        logger.info('Socket info', { id: gameSocket.id });
        gameSocket.on(SOCKET_EVENTS.PROJECTOR.JOINED_ROOM, createSafeEventHandler(
            ({ room, socketId }: ProjectorJoinedRoomPayload) => {
                logger.info('joined_room with runtime validation', { room, socketId });
            },
            isProjectorJoinedRoomPayload,
            'PROJECTOR.JOINED_ROOM'
        ));
        gameSocket.onAny((event, ...args) => {
            logger.debug(`[SOCKET EVENT RECEIVED]`, event, args);
        });
        const handleGameState = createSafeEventHandler(
            (state: ProjectorState) => {
                logger.debug('Processing projector_state', state);
                setGameState(state);

                // Sync timer with backend state through unified system
                if (state.timerStatus === 'stop' ||
                    (state.chrono && state.chrono.timeLeftMs === 0 && state.chrono.running === false)) {
                    gameTimer.stop();
                    return;
                }

                // Handle timer from state
                if (state.timerQuestionUid && state.timerTimeLeft !== undefined && state.timerTimeLeft !== null) {
                    // Use timer from state
                    const timerPayload = {
                        timeLeftMs: state.timerTimeLeft * 1000, // Convert to milliseconds
                        running: state.timerStatus === 'play',
                        questionUid: state.timerQuestionUid,
                        status: (state.timerStatus || 'stop') as TimerStatus
                    };
                    gameTimer.syncWithBackend(timerPayload);
                } else if (state.currentQuestionIdx !== null && typeof state.currentQuestionIdx === 'number' &&
                    state.questions[state.currentQuestionIdx] && state.chrono) {
                    // Use chrono from current question
                    const currentQuestion = state.questions[state.currentQuestionIdx];
                    const timerPayload = {
                        timeLeftMs: (state.chrono.timeLeftMs || 0) * 1000, // Convert to milliseconds
                        running: state.chrono.running,
                        questionUid: currentQuestion.uid,
                        status: (state.chrono.running ? 'play' : 'pause') as TimerStatus
                    };
                    gameTimer.syncWithBackend(timerPayload);
                } else {
                    gameTimer.stop();
                }
            },
            isProjectorState,
            'PROJECTOR.PROJECTOR_STATE'
        );
        const handleTimerUpdate = createSafeEventHandler(
            (data: ProjectorTimerUpdatePayload) => {
                logger.debug('Received projection_timer_updated with runtime validation', data);

                if (data.timer) {
                    const { startedAt, duration, isPaused } = data.timer;

                    // Calculate current remaining time in milliseconds
                    const elapsed = Date.now() - startedAt;
                    const remaining = Math.max(0, duration - elapsed); // Keep in milliseconds

                    const timerPayload = {
                        timeLeftMs: remaining, // Already in milliseconds
                        running: !isPaused,
                        status: (isPaused ? 'pause' : 'play') as TimerStatus
                    };
                    gameTimer.syncWithBackend(timerPayload);
                } else {
                    // Timer stopped/cleared
                    gameTimer.stop();
                }
            },
            isProjectorTimerUpdatePayload,
            'PROJECTOR.PROJECTION_TIMER_UPDATED'
        );
        gameSocket.on(SOCKET_EVENTS.PROJECTOR.PROJECTOR_STATE, handleGameState);
        gameSocket.on(SOCKET_EVENTS.PROJECTOR.PROJECTION_TIMER_UPDATED, handleTimerUpdate);
        gameSocket.on(SOCKET_EVENTS.PROJECTOR.PROJECTOR_CONNECTED_COUNT, createSafeEventHandler(
            (data: ProjectorConnectedCountPayload) => {
                logger.debug('Received projector_connected_count with runtime validation', data);
                setConnectedCount(data.count);
            },
            isProjectorConnectedCountPayload,
            'PROJECTOR.PROJECTOR_CONNECTED_COUNT'
        ));
        gameSocket.on(SOCKET_EVENTS.CONNECT, () => {
            logger.info("Reconnected, projector state will be sent automatically.");
        });
        return () => {
            gameSocket.off(SOCKET_EVENTS.PROJECTOR.PROJECTOR_STATE, handleGameState);
            gameSocket.off(SOCKET_EVENTS.PROJECTOR.PROJECTION_TIMER_UPDATED, handleTimerUpdate);
            gameSocket.off(SOCKET_EVENTS.PROJECTOR.PROJECTOR_CONNECTED_COUNT);
            gameSocket.off(SOCKET_EVENTS.CONNECT);
            gameSocket.offAny();
        };
    }, [gameSocket, gameId]);

    return {
        gameSocket,
        gameState,
        timerStatus,
        timerQuestionUid,
        timeLeftMs,
        localTimeLeftMs,
        setLocalTimeLeft: (value: number | null) => {
            // Compatibility function - delegate to unified timer system
            if (value !== null) {
                gameTimer.setDuration(value * 1000); // Convert to milliseconds
            }
        },
        connectedCount,
    };
}
