/**
 * useSimpleTimer - Clean, Simple Timer Hook
 * 
 * This hook replaces all the complex timer management with a simple, predictable interface
 * that properly consumes the existing solid backend timer system.
 * 
 * Features:
 * - Single source of truth (backend timer state)
 * - Simple action methods (start, pause, resume, stop)
 * - Local countdown for smooth UI updates
 * - Role-based behavior (teacher can control, others just display)
 * - Uses existing backend events and shared types
 */


import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { TEACHER_EVENTS, GAME_EVENTS } from '@shared/types/socket/events';
import type {
    GameTimerState,
    TimerStatus,
    TimerActionPayload,
    GameTimerUpdatePayload
} from '@shared/types/core/timer';

// Canonical helper: compute time left in ms given timerEndDateMs, now, and optional backend timeLeftMs
/**
 * Computes the canonical time left in ms for the timer, given the backend payload.
 * - If timerEndDateMs is a positive number and status is 'run', compute from now.
 * - If status is 'pause' and backend timeLeftMs is provided, use it directly.
 * - If timerEndDateMs is 0 or negative, return 0.
 *
 * @param timerEndDateMs Absolute end date (ms since epoch, UTC)
 * @param now Current time (ms since epoch, UTC)
 * @param status Timer status ('run', 'pause', 'stop')
 * @param backendTimeLeftMs Optional backend-provided timeLeftMs (for pause)
 */
function computeTimeLeftMs(
    timerEndDateMs: number,
    now: number,
    status?: 'run' | 'pause' | 'stop',
    backendTimeLeftMs?: number | null
): number {
    if (status === 'pause') {
        if (typeof backendTimeLeftMs === 'number' && backendTimeLeftMs > 0) {
            return backendTimeLeftMs;
        }
        // If paused but backendTimeLeftMs is missing or not positive, return 1 to avoid UI showing 0
        return 1;
    }
    if (typeof timerEndDateMs === 'number' && timerEndDateMs > 0) {
        return Math.max(0, timerEndDateMs - now);
    }
    return 0;
}

const logger = createLogger('SimpleTimer');

export interface SimpleTimerConfig {
    /** Game ID for the timer (optional for student role) */
    gameId?: string;
    /** Access code for the game */
    accessCode: string;
    /** Socket connection */
    socket: Socket | null;
    /** Role determines available actions */
    role: 'teacher' | 'student' | 'projection';
}


export interface PerQuestionTimerState {
    timeLeftMs: number;
    durationMs: number;
    status: TimerStatus;
    questionUid: string;
    isActive: boolean;
}

export type TimerStateMap = Record<string, PerQuestionTimerState>;

export interface SimpleTimerActions {
    /** Start timer for a question (teacher only) */
    startTimer: (questionUid: string, durationMs: number) => void;
    /** Pause current timer (teacher only) */
    pauseTimer: () => void;
    /** Resume paused timer (teacher only) */
    resumeTimer: () => void;
    /** Stop current timer (teacher only) */
    stopTimer: () => void;
    /** Edit timer duration for a question (teacher only, canonical: emits 'edit' action, no optimistic update) */
    editTimer: (questionUid: string, durationMs: number) => void;
}

export interface SimpleTimerHook extends SimpleTimerActions {
    /** Get timer state for a question */
    getTimerState: (questionUid: string) => PerQuestionTimerState | undefined;
    /** All timer states */
    timerStates: TimerStateMap;
    /** Currently active questionUid (if any) */
    activeQuestionUid: string | null;
    /** Whether socket is connected */
    isConnected: boolean;
    /** Hydrate timer state from canonical timer (for initial game state) */
    hydrateTimerState: (timer: GameTimerState | undefined) => void;
}

/**
 * Simple timer hook that provides clean interface to backend timer system
 */
export function useSimpleTimer(config: SimpleTimerConfig): SimpleTimerHook {
    // Hydrate timer state from canonical timer (for initial game state)
    const hydrateTimerState = (timer: GameTimerState | undefined) => {
        if (!timer || !timer.questionUid) return;
        const now = Date.now();
        const backendTimeLeftMs = (timer as any).timeLeftMs;
        const canonicalDurationMs = typeof (timer as any).durationMs === 'number'
            ? (timer as any).durationMs
            : 0;
        const computedTimeLeftMs = computeTimeLeftMs(
            timer.timerEndDateMs,
            now,
            timer.status,
            backendTimeLeftMs
        );
        const newState: PerQuestionTimerState = {
            timeLeftMs: computedTimeLeftMs,
            durationMs: canonicalDurationMs,
            status: timer.status || 'stop',
            questionUid: timer.questionUid,
            isActive: (timer.status === 'run' || timer.status === 'pause') && computedTimeLeftMs > 0
        };
        setTimerStates(prev => ({ ...prev, [timer.questionUid]: newState }));
        setActiveQuestionUid(timer.questionUid);
        // Start local countdown if timer is running and has time left
        if (timer.status === 'run' && computedTimeLeftMs > 0 && typeof timer.timerEndDateMs === 'number') {
            startLocalCountdown(timer.questionUid, timer.timerEndDateMs);
        } else {
            stopLocalCountdown(timer.questionUid);
        }
    };
    const { gameId, accessCode, socket, role } = config;

    // Debug: Log only if config changes significantly
    const configKey = `${role}-${gameId || 'undefined'}-${accessCode}-${!!socket}`;
    const prevConfigRef = useRef<string>('');

    if (prevConfigRef.current !== configKey) {
        logger.debug('[SimpleTimer] Config changed:', {
            role,
            gameId,
            accessCode,
            hasSocket: !!socket
        });
        prevConfigRef.current = configKey;
    }

    // DEBUG: Add stack trace for excessive calls
    if (typeof accessCode === 'string' && accessCode.length > 10) {
        logger.warn('[SimpleTimer] Suspicious accessCode detected (might be gameId):', { accessCode });
        console.trace('Timer hook called with long accessCode');
    }


    // Canonical: timer state per questionUid
    const [timerStates, setTimerStates] = useState<TimerStateMap>({});
    const [activeQuestionUid, setActiveQuestionUid] = useState<string | null>(null);
    // Local countdowns per question
    const localCountdownRefs = useRef<Record<string, NodeJS.Timeout | null>>({});

    // Socket connection state
    const isConnected = socket?.connected ?? false;

    // Clear all local countdowns on unmount
    useEffect(() => {
        return () => {
            Object.keys(localCountdownRefs.current).forEach(qid => {
                if (localCountdownRefs.current[qid]) {
                    clearInterval(localCountdownRefs.current[qid]!);
                    localCountdownRefs.current[qid] = null;
                }
            });
        };
    }, []);

    // Listen for timer updates from backend (per question)
    useEffect(() => {
        if (!socket) return;

        const handleTimerUpdate = (payload: GameTimerUpdatePayload) => {
            logger.info('[SimpleTimer][handleTimerUpdate] Timer update received', { payload });
            const { timer } = payload;
            if (!timer || !timer.questionUid) return;
            const now = Date.now();
            const backendTimeLeftMs = (timer as any).timeLeftMs;
            const canonicalDurationMs = typeof (timer as any).durationMs === 'number'
                ? (timer as any).durationMs
                : (typeof (payload as any).durationMs === 'number' ? (payload as any).durationMs : 0);
            const computedTimeLeftMs = computeTimeLeftMs(
                timer.timerEndDateMs,
                now,
                timer.status,
                backendTimeLeftMs
            );
            const newState: PerQuestionTimerState = {
                timeLeftMs: computedTimeLeftMs,
                durationMs: canonicalDurationMs,
                status: timer.status || 'stop',
                questionUid: timer.questionUid,
                isActive: (timer.status === 'run' || timer.status === 'pause') && computedTimeLeftMs > 0
            };
            setTimerStates(prev => ({ ...prev, [timer.questionUid]: newState }));
            setActiveQuestionUid(timer.questionUid);
            // Local countdown for this question
            if (newState.status === 'run' && newState.timeLeftMs > 0) {
                startLocalCountdown(timer.questionUid, timer.timerEndDateMs);
            } else {
                stopLocalCountdown(timer.questionUid);
            }
        };

        const eventName = role === 'teacher'
            ? TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED
            : role === 'projection'
                ? TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED
                : GAME_EVENTS.GAME_TIMER_UPDATED;

        socket.on(eventName, handleTimerUpdate);
        if (role === 'student') {
            socket.on(GAME_EVENTS.TIMER_UPDATE, handleTimerUpdate);
        }
        return () => {
            socket.off(eventName, handleTimerUpdate);
            if (role === 'student') {
                socket.off(GAME_EVENTS.TIMER_UPDATE, handleTimerUpdate);
            }
            // Stop all local countdowns
            Object.keys(localCountdownRefs.current).forEach(qid => stopLocalCountdown(qid));
        };
    }, [socket, role]);

    // Local countdown management per question
    const startLocalCountdown = useCallback((questionUid: string, timerEndDateMs: number) => {
        stopLocalCountdown(questionUid);
        logger.info('[SimpleTimer] Starting countdown interval (canonical):', {
            questionUid,
            timerEndDateMs,
            currentTime: Date.now()
        });
        localCountdownRefs.current[questionUid] = setInterval(() => {
            const now = Date.now();
            const remaining = computeTimeLeftMs(timerEndDateMs, now);
            setTimerStates(prev => {
                const prevState = prev[questionUid];
                if (!prevState) return prev;
                return {
                    ...prev,
                    [questionUid]: {
                        ...prevState,
                        timeLeftMs: remaining
                    }
                };
            });
            if (remaining <= 0) {
                logger.info('[SimpleTimer] Countdown reached zero, stopping', { questionUid });
                stopLocalCountdown(questionUid);
                // For teachers, automatically stop the timer on the backend when it expires
                if (role === 'teacher' && socket) {
                    logger.info('Timer expired, automatically stopping timer:', { questionUid });
                    const payload: TimerActionPayload = {
                        accessCode,
                        action: 'stop',
                        targetTimeMs: 0,
                        questionUid
                    };
                    socket.emit(TEACHER_EVENTS.TIMER_ACTION, payload);
                }
            }
        }, 100);
    }, [role, socket, accessCode]);

    const stopLocalCountdown = useCallback((questionUid: string) => {
        if (localCountdownRefs.current[questionUid]) {
            clearInterval(localCountdownRefs.current[questionUid]!);
            localCountdownRefs.current[questionUid] = null;
        }
    }, []);

    // Teacher actions (only available for teacher role)
    // Canonical: Only use canonical action names and fields
    const startTimer = useCallback((questionUid: string, durationMs: number) => {
        if (role !== 'teacher' || !socket) {
            logger.warn('startTimer called but user is not teacher or socket not available');
            return;
        }
        logger.info('Starting timer:', { questionUid, durationMs });
        const now = Date.now();
        const timerEndDateMs = now + durationMs;
        const payload: TimerActionPayload = {
            accessCode,
            action: 'run',
            timerEndDateMs,
            targetTimeMs: durationMs,
            questionUid
        };
        socket.emit(TEACHER_EVENTS.TIMER_ACTION, payload);
    }, [role, socket, accessCode]);

    const pauseTimer = useCallback(() => {
        if (role !== 'teacher' || !socket || !activeQuestionUid) {
            logger.warn('pauseTimer called but conditions not met');
            return;
        }
        logger.info('Pausing timer:', { questionUid: activeQuestionUid });
        const payload: TimerActionPayload = {
            accessCode,
            action: 'pause',
            questionUid: activeQuestionUid
        };
        socket.emit(TEACHER_EVENTS.TIMER_ACTION, payload);
    }, [role, socket, accessCode, activeQuestionUid]);

    const resumeTimer = useCallback(() => {
        if (role !== 'teacher' || !socket || !activeQuestionUid) {
            logger.warn('resumeTimer called but conditions not met');
            return;
        }
        logger.info('Resuming timer:', { questionUid: activeQuestionUid });
        const payload: TimerActionPayload = {
            accessCode,
            action: 'run',
            questionUid: activeQuestionUid
        };
        socket.emit(TEACHER_EVENTS.TIMER_ACTION, payload);
    }, [role, socket, accessCode, activeQuestionUid]);

    const stopTimer = useCallback(() => {
        if (role !== 'teacher' || !socket || !activeQuestionUid) {
            logger.warn('stopTimer called but conditions not met');
            return;
        }
        logger.info('Stopping timer:', { questionUid: activeQuestionUid });
        const payload: TimerActionPayload = {
            accessCode,
            action: 'stop',
            questionUid: activeQuestionUid
        };
        socket.emit(TEACHER_EVENTS.TIMER_ACTION, payload);
    }, [role, socket, accessCode, activeQuestionUid]);

    /**
     * Canonical editTimer: emits 'edit' action with required questionUid and durationMs.
     * No optimistic update; UI updates only on backend response.
     */
    const editTimer = useCallback((questionUid: string, durationMs: number) => {
        if (role !== 'teacher' || !socket) {
            logger.warn('[SimpleTimer][editTimer] called but user is not teacher or socket not available');
            return;
        }
        logger.info('[SimpleTimer][editTimer] Emitting canonical edit action', { questionUid, durationMs });
        // Debug: log full payload before emit
        const payload: TimerActionPayload = {
            accessCode,
            action: 'edit',
            questionUid,
            durationMs
        };
        logger.debug('[SimpleTimer][editTimer] Payload to emit:', payload);
        socket.emit(TEACHER_EVENTS.TIMER_ACTION, payload);
    }, [role, socket, accessCode]);

    // Canonical: expose per-question timer state
    const getTimerState = useCallback((questionUid: string): PerQuestionTimerState | undefined => {
        return timerStates[questionUid];
    }, [timerStates]);

    return {
        getTimerState,
        timerStates,
        activeQuestionUid,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        editTimer,
        isConnected,
        hydrateTimerState
    };
}
