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
import { TEACHER_EVENTS, GAME_EVENTS, SOCKET_EVENTS } from '@shared/types/socket/events';
import type {
    GameTimerState,
    TimerStatus,
    TimerActionPayload,
    GameTimerUpdatePayload
} from '@shared/types';

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
    /** Timer status */
    status: TimerStatus;
    /** Associated question UID */
    questionUid: string | null;
    /** Total duration in milliseconds */
    durationMs: number;
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

    // Core timer state
    const [timerState, setTimerState] = useState<SimpleTimerState>({
        timeLeftMs: 0,
        status: 'stop',
        questionUid: null,
        durationMs: 0,
        isActive: false
    });

    // Local countdown state for smooth UI updates
    const [localTimeLeft, setLocalTimeLeft] = useState<number>(0);
    const localTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastUpdateRef = useRef<number>(0);

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
            logger.info(`[SimpleTimer] Timer update received for role ${role}:`, payload);
            logger.debug(`[SimpleTimer] Event: ${eventName}, Payload:`, payload);

            // DEBUG: Check if we're getting spammed with updates
            const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
            if (timeSinceLastUpdate < 500) {
                logger.warn(`[SimpleTimer] Rapid timer updates detected! Time since last: ${timeSinceLastUpdate}ms`);
            }

            const { timer, questionUid } = payload;
            const now = Date.now();

            // Update main timer state
            const newState: SimpleTimerState = {
                timeLeftMs: timer.timeLeftMs || 0,
                status: timer.status || 'stop',
                questionUid: questionUid || null,
                durationMs: timer.durationMs || 0,
                isActive: (timer.status === 'play' || timer.status === 'pause') && (timer.timeLeftMs || 0) > 0
            };

            setTimerState(newState);
            setLocalTimeLeft(newState.timeLeftMs);
            lastUpdateRef.current = now;

            // Start local countdown if timer is playing
            if (newState.status === 'play' && newState.timeLeftMs > 0) {
                logger.info('[SimpleTimer] Starting local countdown:', {
                    timeLeftMs: newState.timeLeftMs,
                    status: newState.status
                });
                startLocalCountdown(newState.timeLeftMs, now);
            } else {
                stopLocalCountdown();
            }
        };

        // Listen to appropriate event based on role
        const eventName = role === 'teacher'
            ? TEACHER_EVENTS.DASHBOARD_TIMER_UPDATED
            : role === 'projection'
                ? SOCKET_EVENTS.PROJECTOR.PROJECTION_TIMER_UPDATED  // Use shared constant
                : GAME_EVENTS.GAME_TIMER_UPDATED;       // Backend sends this for students

        socket.on(eventName, handleTimerUpdate);

        // For students, also listen to the alternative timer_update event
        if (role === 'student') {
            socket.on(GAME_EVENTS.TIMER_UPDATE, handleTimerUpdate);
        }

        // Cleanup
        return () => {
            socket.off(eventName, handleTimerUpdate);
            if (role === 'student') {
                socket.off(GAME_EVENTS.TIMER_UPDATE, handleTimerUpdate);
            }
            stopLocalCountdown();
        };
    }, [socket, role]);

    // Local countdown management
    const startLocalCountdown = useCallback((initialTime: number, startTimestamp: number) => {
        stopLocalCountdown(); // Clear any existing countdown

        logger.info('[SimpleTimer] Starting countdown interval:', {
            initialTime,
            currentTime: Date.now()
        });

        localTimerRef.current = setInterval(() => {
            const now = Date.now();
            const elapsed = now - startTimestamp;
            const remaining = Math.max(0, initialTime - elapsed);

            setLocalTimeLeft(remaining);

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
                        duration: 0,
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
    const startTimer = useCallback((questionUid: string, durationMs: number) => {
        if (role !== 'teacher' || !socket) {
            logger.warn('startTimer called but user is not teacher or socket not available');
            return;
        }

        logger.info('Starting timer:', { questionUid, durationMs });

        const payload: TimerActionPayload = {
            accessCode,
            action: 'start',
            duration: durationMs,
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
            duration: localTimeLeft, // Send current remaining time
            questionUid: timerState.questionUid
        };

        socket.emit(TEACHER_EVENTS.TIMER_ACTION, payload);
    }, [role, socket, accessCode, timerState.questionUid, localTimeLeft]);

    const resumeTimer = useCallback(() => {
        if (role !== 'teacher' || !socket || !timerState.questionUid) {
            logger.warn('resumeTimer called but conditions not met');
            return;
        }

        logger.info('Resuming timer:', { questionUid: timerState.questionUid });

        const payload: TimerActionPayload = {
            accessCode,
            action: 'resume',
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
            duration: 0,
            questionUid: timerState.questionUid
        };

        socket.emit(TEACHER_EVENTS.TIMER_ACTION, payload);
    }, [role, socket, accessCode, timerState.questionUid]);

    // Return the hook interface
    return {
        // State (use local countdown for smooth UI, fallback to backend state)
        timeLeftMs: timerState.status === 'play' ? localTimeLeft : timerState.timeLeftMs,
        status: timerState.status,
        questionUid: timerState.questionUid,
        durationMs: timerState.durationMs,
        isActive: timerState.isActive,

        // Actions (only work for teachers)
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,

        // Connection state
        isConnected
    };
}
