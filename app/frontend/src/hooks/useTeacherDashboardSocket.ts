import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useGameSocket } from '@/hooks/useGameSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import type { Socket } from 'socket.io-client';
import { z } from 'zod';
import { createLogger } from '@/clientLogger';
import type {
    ConnectedCountPayload,
    DashboardAnswerStatsUpdatePayload,
    DashboardQuestionChangedPayload,
    JoinDashboardPayload,
} from '@shared/types/socket/dashboardPayloads';
import {
    gameControlStatePayloadSchema,
    type GameControlStatePayload,
    showCorrectAnswersPayloadSchema,
    type ShowCorrectAnswersPayload,
} from '@shared/types/socketEvents.zod.dashboard';

const logger = createLogger('useTeacherDashboardSocket');

export type DashboardEventHandlers = {
    onGameControlState?: (payload: GameControlStatePayload) => void;
    onDashboardTimerUpdated?: (payload: any) => void; // timer shape validated upstream
    onConnectedCount?: (payload: ConnectedCountPayload) => void;
    onToggleProjectionStats?: (payload: { show: boolean }) => void;
    onShowCorrectAnswers?: (payload: ShowCorrectAnswersPayload) => void;
    onAnswerStatsUpdate?: (payload: DashboardAnswerStatsUpdatePayload) => void;
    onQuestionChanged?: (payload: DashboardQuestionChangedPayload) => void;
};

const joinDashboardPayloadSchema = z.object({ accessCode: z.string().min(1) });

export function useTeacherDashboardSocket(params: {
    accessCode: string;
    gameId?: string | null;
    handlers?: DashboardEventHandlers;
}) {
    const { accessCode, gameId = null, handlers = {} } = params;

    const base = useGameSocket('teacher', gameId, { requireAuth: true, autoConnect: true, autoReconnect: true });
    const { socket, socketState, connect } = base;

    // Track if we have ever connected to differentiate initial connect_error vs reconnect
    const hasEverConnectedRef = useRef(false);
    useEffect(() => {
        if (socketState.connected) {
            hasEverConnectedRef.current = true;
        }
    }, [socketState.connected]);

    // Derived reconnecting flag for UX
    const reconnecting = useMemo(
        () => hasEverConnectedRef.current && !socketState.connected,
        [socketState.connected]
    );

    // Emit JOIN_DASHBOARD on every successful connect
    useEffect(() => {
        if (!socket?.connected) return;
        try {
            const payload: JoinDashboardPayload = { accessCode } as any;
            joinDashboardPayloadSchema.parse(payload);
            logger.info('Emitting JOIN_DASHBOARD with accessCode:', accessCode);
            (socket as any).emit(SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD, payload);
        } catch (err) {
            logger.error('Invalid JOIN_DASHBOARD payload:', err);
        }
    }, [socket?.connected, socket, accessCode]);

    // Bind dashboard-specific events and forward to handlers
    useEffect(() => {
        if (!socket) return;

        // Define all handlers upfront
        const onGameControlState = (state: any) => {
            const parsed = gameControlStatePayloadSchema.safeParse(state);
            if (!parsed.success) {
                logger.error('Invalid GAME_CONTROL_STATE payload', parsed.error);
                return;
            }
            handlers.onGameControlState?.(parsed.data);
        };

        const onTimer = (payload: any) => {
            handlers.onDashboardTimerUpdated?.(payload);
        };

        const onCount = (payload: ConnectedCountPayload) => {
            handlers.onConnectedCount?.(payload);
        };

        const onProjStats = (payload: { show: boolean }) => {
            if (typeof payload?.show === 'boolean') {
                // Defer callback slightly to avoid nested React act during test-driven synthetic emissions
                setTimeout(() => handlers.onToggleProjectionStats?.(payload), 0);
            }
        };

        const onShowCorrect = (payload: ShowCorrectAnswersPayload) => {
            const parsed = showCorrectAnswersPayloadSchema.safeParse(payload);
            if (!parsed.success) {
                logger.error('Invalid SHOW_CORRECT_ANSWERS payload', parsed.error);
                return;
            }
            handlers.onShowCorrectAnswers?.(parsed.data);
        };

        const onAnsStats = (payload: DashboardAnswerStatsUpdatePayload) => {
            handlers.onAnswerStatsUpdate?.(payload);
        };

        const onQuestionChanged = (payload: DashboardQuestionChangedPayload) => {
            handlers.onQuestionChanged?.(payload);
        };

        // Defer binding to the next tick to avoid nested act() in tests that synchronously emit during registration
        let registered = false;
        const bind = () => {
            if (!socket) return;
            socket.on(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE as any, onGameControlState);
            socket.on(SOCKET_EVENTS.TEACHER.DASHBOARD_TIMER_UPDATED as any, onTimer);
            socket.on('quiz_connected_count' as any, onCount);
            socket.on(SOCKET_EVENTS.TEACHER.TOGGLE_PROJECTION_STATS as any, onProjStats);
            // Some backends may emit canonical projection_show_stats to dashboard as well; accept it
            socket.on((SOCKET_EVENTS as any).PROJECTOR?.PROJECTION_SHOW_STATS ?? 'projection_show_stats', onProjStats);
            socket.on(SOCKET_EVENTS.TEACHER.SHOW_CORRECT_ANSWERS as any, onShowCorrect);
            socket.on(SOCKET_EVENTS.TEACHER.ANSWER_STATS_UPDATE as any, onAnsStats);
            socket.on(SOCKET_EVENTS.TEACHER.DASHBOARD_ANSWER_STATS_UPDATE as any, onAnsStats);
            socket.on(SOCKET_EVENTS.TEACHER.DASHBOARD_QUESTION_CHANGED as any, onQuestionChanged);
            registered = true;
        };

        const timeoutId = setTimeout(bind, 0);

        return () => {
            clearTimeout(timeoutId);
            if (!socket || !registered) return;
            socket.off(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE as any, onGameControlState);
            socket.off(SOCKET_EVENTS.TEACHER.DASHBOARD_TIMER_UPDATED as any, onTimer);
            socket.off('quiz_connected_count' as any, onCount);
            socket.off(SOCKET_EVENTS.TEACHER.TOGGLE_PROJECTION_STATS as any, onProjStats);
            socket.off((SOCKET_EVENTS as any).PROJECTOR?.PROJECTION_SHOW_STATS ?? 'projection_show_stats', onProjStats);
            socket.off(SOCKET_EVENTS.TEACHER.SHOW_CORRECT_ANSWERS as any, onShowCorrect);
            socket.off(SOCKET_EVENTS.TEACHER.ANSWER_STATS_UPDATE as any, onAnsStats);
            socket.off(SOCKET_EVENTS.TEACHER.DASHBOARD_ANSWER_STATS_UPDATE as any, onAnsStats);
            socket.off(SOCKET_EVENTS.TEACHER.DASHBOARD_QUESTION_CHANGED as any, onQuestionChanged);
        };
    }, [socket, handlers]);

    // Expose a thin API for the component
    const emitRevealLeaderboard = useCallback(() => {
        if (!socket?.connected) return;
        (socket as any).emit(SOCKET_EVENTS.TEACHER.REVEAL_LEADERBOARD, { accessCode });
        (socket as any).emit(SOCKET_EVENTS.TEACHER.SHOW_CORRECT_ANSWERS, { accessCode });
    }, [socket, accessCode]);

    const emitEndGame = useCallback(() => {
        if (!socket?.connected) return;
        (socket as any).emit(SOCKET_EVENTS.TEACHER.END_GAME, { accessCode });
    }, [socket, accessCode]);

    return {
        socket: socket as Socket | null,
        state: {
            connected: socketState.connected,
            reconnecting,
            error: socketState.error,
            reconnectAttempts: socketState.reconnectAttempts,
        },
        connect,
        emit: {
            revealLeaderboard: emitRevealLeaderboard,
            endGame: emitEndGame,
        },
    };
}
