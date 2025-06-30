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

export interface SimpleTimerState {
    /** Current time remaining in milliseconds */
    timeLeftMs: number;
    /** Canonical timer duration in milliseconds */
    durationMs: number;
    /** Timer status */
    status: TimerStatus;
    /** Associated question UID */
    questionUid: string | null;
    /** Whether this timer is for the current user's role */
    isActive: boolean;
}

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

export interface SimpleTimerHook extends SimpleTimerState, SimpleTimerActions {
    /** Whether socket is connected */
    isConnected: boolean;
}

/**
 * Simple timer hook that provides clean interface to backend timer system
 */
export function useSimpleTimer(config: SimpleTimerConfig): SimpleTimerHook {
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

    // Core timer state - start with default values
    const [timerState, setTimerState] = useState<SimpleTimerState>({
        timeLeftMs: 0,
        durationMs: 0,
        status: 'stop',
        questionUid: null,
        isActive: false
    });

    // Local countdown state for smooth UI updates
    const [localTimeLeft, setLocalTimeLeft] = useState<number>(0);
    const localTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastUpdateRef = useRef<number>(0);
    // Track last timerEndDateMs to detect timer restarts
    const lastTimerEndDateMsRef = useRef<number>(0);

    // Socket connection state
    const isConnected = socket?.connected ?? false;

    // Clear local timer on unmount
    useEffect(() => {
        return () => {
            if (localTimerRef.current) {
                clearInterval(localTimerRef.current);
                localTimerRef.current = null;
            }
        };
    }, []);

    // Listen for timer updates from backend
    useEffect(() => {
        if (!socket) return;

        const handleTimerUpdate = (payload: GameTimerUpdatePayload) => {
            logger.info('[SimpleTimer][handleTimerUpdate] Timer update received', { payload });
            const { timer } = payload;
            logger.info('[SimpleTimer][handleTimerUpdate] Current timerState before update', { timerState });
            // Canonical: use backend timeLeftMs for pause, compute from timerEndDateMs for run
            const now = Date.now();
            let computedTimeLeftMs = 0;
            // Use canonical helper to compute time left, supporting pause/resume
            // timer.timeLeftMs is not part of GameTimerState, but may be present in payload.timer (backend emits it)
            const backendTimeLeftMs = (timer as any).timeLeftMs;
            // Canonical: durationMs may be present in payload.timer or payload
            const canonicalDurationMs = typeof (timer as any).durationMs === 'number'
                ? (timer as any).durationMs
                : (typeof (payload as any).durationMs === 'number' ? (payload as any).durationMs : 0);
            computedTimeLeftMs = computeTimeLeftMs(
                timer.timerEndDateMs,
                now,
                timer.status,
                backendTimeLeftMs
            );
            if (timer.status === 'run') {
                logger.info('[SimpleTimer][handleTimerUpdate] RUN: computedTimeLeftMs from timerEndDateMs', { computedTimeLeftMs, timerEndDateMs: timer.timerEndDateMs });
            } else if (timer.status === 'pause') {
                logger.info('[SimpleTimer][handleTimerUpdate] PAUSE: using backend timeLeftMs', { computedTimeLeftMs, backendTimeLeftMs });
            } else if (timer.status === 'stop') {
                logger.info('[SimpleTimer][handleTimerUpdate] STOP: timer stopped', { computedTimeLeftMs });
            }
            logger.info('[SimpleTimer][handleTimerUpdate] Setting timerState to', {
                timeLeftMs: computedTimeLeftMs,
                durationMs: canonicalDurationMs,
                status: timer.status || 'stop',
                questionUid: timer.questionUid,
                isActive: (timer.status === 'run' || timer.status === 'pause') && computedTimeLeftMs > 0
            });

            const newState: SimpleTimerState = {
                timeLeftMs: computedTimeLeftMs,
                durationMs: canonicalDurationMs,
                status: timer.status || 'stop',
                questionUid: timer.questionUid,
                isActive: (timer.status === 'run' || timer.status === 'pause') && computedTimeLeftMs > 0
            };

            setTimerState(newState);
            // Always reset local countdown to the correct value
            setLocalTimeLeft(computedTimeLeftMs);
            lastUpdateRef.current = now;

            // Start or stop local countdown based on backend status
            if (newState.status === 'run' && newState.timeLeftMs > 0) {
                logger.info('[SimpleTimer] Starting local countdown:', {
                    timeLeftMs: newState.timeLeftMs,
                    status: newState.status
                });
                startLocalCountdown(timer.timerEndDateMs);
            } else if (newState.status === 'pause') {
                // Stop local countdown when paused
                stopLocalCountdown();
            } else if (newState.status === 'stop') {
                stopLocalCountdown();
            }
        };

        // Listen to appropriate event based on role
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
            stopLocalCountdown();
        };
    }, [socket, role]);

    // Local countdown management
    // Canonical: local countdown always ticks down from timerEndDateMs
    const startLocalCountdown = useCallback((timerEndDateMs: number) => {
        stopLocalCountdown(); // Clear any existing countdown

        logger.info('[SimpleTimer] Starting countdown interval (canonical):', {
            timerEndDateMs,
            currentTime: Date.now()
        });

        localTimerRef.current = setInterval(() => {
            const now = Date.now();
            const remaining = computeTimeLeftMs(timerEndDateMs, now);
            setLocalTimeLeft(remaining); // This triggers a re-render

            // Stop countdown when it reaches zero
            if (remaining <= 0) {
                logger.info('[SimpleTimer] Countdown reached zero, stopping');
                stopLocalCountdown();

                // For teachers, automatically stop the timer on the backend when it expires
                if (role === 'teacher' && socket && timerState.questionUid) {
                    logger.info('Timer expired, automatically stopping timer:', { questionUid: timerState.questionUid });

                    const payload: TimerActionPayload = {
                        accessCode,
                        action: 'stop',
                        targetTimeMs: 0,
                        questionUid: timerState.questionUid
                    };

                    socket.emit(TEACHER_EVENTS.TIMER_ACTION, payload);
                }
            }
        }, 100); // Update every 100ms for smooth countdown
    }, [role, socket, accessCode, timerState.questionUid]);

    const stopLocalCountdown = useCallback(() => {
        if (localTimerRef.current) {
            clearInterval(localTimerRef.current);
            localTimerRef.current = null;
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
        if (role !== 'teacher' || !socket || !timerState.questionUid) {
            logger.warn('pauseTimer called but conditions not met');
            return;
        }
        logger.info('Pausing timer:', { questionUid: timerState.questionUid });
        const payload: TimerActionPayload = {
            accessCode,
            action: 'pause',
            questionUid: timerState.questionUid
        };
        socket.emit(TEACHER_EVENTS.TIMER_ACTION, payload);
    }, [role, socket, accessCode, timerState.questionUid]);

    const resumeTimer = useCallback(() => {
        if (role !== 'teacher' || !socket || !timerState.questionUid) {
            logger.warn('resumeTimer called but conditions not met');
            return;
        }
        logger.info('Resuming timer:', { questionUid: timerState.questionUid });
        const payload: TimerActionPayload = {
            accessCode,
            action: 'run',
            questionUid: timerState.questionUid
        };
        socket.emit(TEACHER_EVENTS.TIMER_ACTION, payload);
    }, [role, socket, accessCode, timerState.questionUid]);

    const stopTimer = useCallback(() => {
        if (role !== 'teacher' || !socket || !timerState.questionUid) {
            logger.warn('stopTimer called but conditions not met');
            return;
        }
        logger.info('Stopping timer:', { questionUid: timerState.questionUid });
        const payload: TimerActionPayload = {
            accessCode,
            action: 'stop',
            questionUid: timerState.questionUid
        };
        socket.emit(TEACHER_EVENTS.TIMER_ACTION, payload);
    }, [role, socket, accessCode, timerState.questionUid]);

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

    // Return the hook interface
    // Always use backend's timeLeftMs for pause, never show 0 unless time is actually up
    let displayTimeLeftMs = timerState.timeLeftMs;
    if (timerState.status === 'run') {
        displayTimeLeftMs = localTimeLeft;
    } else if (timerState.status === 'pause') {
        // If backend timeLeftMs is 0 or undefined, show 1ms to avoid UI showing 0 unless truly expired
        if (typeof timerState.timeLeftMs !== 'number' || timerState.timeLeftMs <= 0) {
            displayTimeLeftMs = 1;
        }
    }
    return {
        timeLeftMs: displayTimeLeftMs,
        durationMs: timerState.durationMs,
        status: timerState.status,
        questionUid: timerState.questionUid,
        isActive: timerState.isActive,

        // Actions (only work for teachers)
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        editTimer,

        // Connection state
        isConnected
    };
}
