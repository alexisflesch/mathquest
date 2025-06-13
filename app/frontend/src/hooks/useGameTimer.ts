/**
 * useGameTimer - Unified Timer Management Hook
 * 
 * This hook consolidates all timer management functionality from:
 * - useTeacherQuizSocket (teacher control and dashboard view)
 * - useProjectionQuizSocket (projection display with animations)
 * - useStudentGameSocket (student view with countdown)
 * - useTournamentSocket (tournament-specific timing)
 * 
 * Phase 2 of the Frontend Modernization Plan
 * Goal: Create unified timer management with role-based behavior
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { TIMER_CONFIG, UI_CONFIG } from '@/config/gameConfig';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import type {
    TimerUpdatePayload,
    GameTimerUpdatePayload,
    TimerRole,
    TimerStatus,
    GameTimerState,
    TimerConfig
} from '@shared/types';
import { logTimerEvent, logTimerState, logTimerCalculation, logTimerError } from '@/utils/timerDebugLogger';

// Export types for use by other components
export type { TimerRole, TimerStatus, GameTimerState as TimerState } from '@shared/types';
import { isTimerUpdatePayload, createSafeEventHandler } from '@/types/socketTypeGuards';

const logger = createLogger('useGameTimer');

// --- Timer Hook Interface ---
export interface GameTimerHook {
    // State
    timerState: GameTimerState;
    isRunning: boolean;

    // Actions
    start: (questionUid: string, duration?: number) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    reset: (duration?: number) => void;
    setDuration: (duration: number) => void;

    // Time formatting utilities
    formatTime: (time: number, showMs?: boolean) => string;

    // Role-specific methods
    syncWithBackend: (payload: TimerUpdatePayload | GameTimerUpdatePayload) => void;
    getDisplayTime: () => number;
}

// --- Default Timer Configurations by Role ---
const DEFAULT_CONFIGS: Record<TimerRole, TimerConfig> = {
    teacher: {
        role: 'teacher',
        autoStart: false,
        smoothCountdown: true, // Enable smooth countdown for teacher dashboard
        showMilliseconds: false,
        enableLocalAnimation: true, // Enable local countdown animation for teacher dashboard
        updateThreshold: TIMER_CONFIG.UI_UPDATE_INTERVAL_TEACHER // Use role-specific interval
    },
    student: {
        role: 'student',
        autoStart: true,
        smoothCountdown: true,
        showMilliseconds: false,
        enableLocalAnimation: true,
        updateThreshold: TIMER_CONFIG.UI_UPDATE_INTERVAL_STUDENT // Use role-specific interval
    },
    projection: {
        role: 'projection',
        autoStart: true,
        smoothCountdown: true,
        showMilliseconds: true,
        enableLocalAnimation: true,
        updateThreshold: TIMER_CONFIG.UI_UPDATE_INTERVAL_PROJECTION // Use role-specific interval for smooth animations
    },
    tournament: {
        role: 'tournament',
        autoStart: true,
        smoothCountdown: true,
        showMilliseconds: false,
        enableLocalAnimation: true,
        updateThreshold: TIMER_CONFIG.UI_UPDATE_INTERVAL_STUDENT // Tournaments are student-facing, use student interval
    }
};

/**
 * Unified Game Timer Hook
 * 
 * Provides role-based timer management with consistent behavior across
 * all timer use cases in the application.
 * 
 * @param role - The role of the timer (teacher, student, projection, tournament)
 * @param socket - Optional socket for event handling
 * @param customConfig - Optional configuration overrides
 * @returns GameTimerHook interface with timer state and controls
 */
export function useGameTimer(
    role: TimerRole,
    socket?: Socket | null,
    customConfig?: Partial<TimerConfig>
): GameTimerHook {

    // Merge default config with custom overrides - memoize to prevent infinite re-renders
    const config: TimerConfig = useMemo(() => ({
        ...DEFAULT_CONFIGS[role],
        ...customConfig
    }), [role, customConfig]);

    // --- Timer State ---
    const [timerState, setTimerState] = useState<GameTimerState>({
        status: 'stop',
        timeLeftMs: 0,
        durationMs: TIMER_CONFIG.DEFAULT_QUESTION_TIME,
        questionUid: undefined,
        timestamp: null,
        localTimeLeftMs: null
    });

    // --- Timer References for Animation ---
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const initialDurationRef = useRef<number | null>(null);
    const lastUpdateTimeRef = useRef<number>(0);
    const localTimeLeftRef = useRef<number | null>(null);

    // --- Derived State ---
    const isRunning = timerState.status === 'play';

    // --- Cleanup Function ---
    const cleanup = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        startTimeRef.current = null;
        initialDurationRef.current = null;
    }, []);

    // --- Timer Update Function with Throttling ---
    const updateThreshold = useMemo(() =>
        config.updateThreshold || UI_CONFIG.LEADERBOARD_UPDATE_INTERVAL,
        [config.updateThreshold]
    );

    const enableLocalAnimation = useMemo(() =>
        config.enableLocalAnimation,
        [config.enableLocalAnimation]
    );

    const updateLocalTimeLeft = useCallback((newTimeLeftMs: number) => {
        const now = Date.now();
        const previousValue = localTimeLeftRef.current;

        // Always update the ref value
        localTimeLeftRef.current = newTimeLeftMs;

        // Only update state if value changed significantly to prevent excessive re-renders
        const valueChange = Math.abs((previousValue || 0) - newTimeLeftMs);

        // Update if this is the first time or if value changed by at least 100ms
        if (previousValue === null || valueChange >= 100) {
            setTimerState((prev: GameTimerState) => ({
                ...prev,
                timeLeftMs: newTimeLeftMs,
                localTimeLeftMs: newTimeLeftMs
            }));
            lastUpdateTimeRef.current = now;
        }
    }, []); // No dependencies to avoid recreation

    // --- Animation Loop for Smooth Countdown ---
    const startAnimationLoop = useCallback(() => {
        if (!enableLocalAnimation) return;

        // Use role-specific update interval from config
        const intervalMs = config.updateThreshold || TIMER_CONFIG.UI_UPDATE_INTERVAL;

        const intervalTick = () => {
            if (startTimeRef.current === null || initialDurationRef.current === null) return;

            const now = Date.now();
            const elapsedMs = now - startTimeRef.current;
            const remainingMs = Math.max(initialDurationRef.current - elapsedMs, 0);
            updateLocalTimeLeft(remainingMs);

            if (remainingMs <= 0) {
                // Timer expired
                setTimerState((prev: GameTimerState) => ({
                    ...prev,
                    status: 'stop',
                    timeLeftMs: 0,
                    localTimeLeftMs: 0
                }));
                cleanup();
            }
        };

        // Set initial state immediately
        if (startTimeRef.current !== null && initialDurationRef.current !== null) {
            updateLocalTimeLeft(initialDurationRef.current);
        }

        // Start the interval and run the first tick immediately
        intervalTick(); // Run first tick immediately to avoid delay
        timerRef.current = setInterval(intervalTick, intervalMs);
    }, [enableLocalAnimation, updateLocalTimeLeft, cleanup, config.updateThreshold]);

    // --- Local Countdown Function ---
    const startLocalCountdown = useCallback((timeLeftMs: number) => {
        if (enableLocalAnimation) {
            const now = Date.now();
            startTimeRef.current = now;
            initialDurationRef.current = timeLeftMs;
            startAnimationLoop();
        } else {
            // Simple countdown without animation
            setTimerState((prev: GameTimerState) => ({
                ...prev,
                timeLeftMs: timeLeftMs,
                localTimeLeftMs: timeLeftMs
            }));
        }
    }, [enableLocalAnimation, startAnimationLoop]);

    // --- Timer Actions ---
    const start = useCallback((questionUid: string, duration?: number) => {
        logger.info(`[${role.toUpperCase()}] Starting timer for question ${questionUid}`);

        cleanup();

        const timerDuration = duration || timerState.durationMs || TIMER_CONFIG.DEFAULT_QUESTION_TIME;
        const now = Date.now();

        setTimerState((prev: GameTimerState) => ({
            ...prev,
            status: 'play',
            questionUid,
            durationMs: timerDuration,
            timeLeftMs: timerDuration,
            timestamp: now,
            localTimeLeftMs: timerDuration
        }));

        if (config.enableLocalAnimation) {
            startTimeRef.current = now;
            initialDurationRef.current = timerDuration;
            startAnimationLoop();
        }
    }, [role, timerState.durationMs, cleanup, config.enableLocalAnimation, startAnimationLoop]);

    const pause = useCallback(() => {
        logger.info(`[${role.toUpperCase()}] Pausing timer`);

        cleanup();

        setTimerState((prev: GameTimerState) => ({
            ...prev,
            status: 'pause',
            timestamp: Date.now()
        }));
    }, [role, cleanup]);

    const resume = useCallback(() => {
        logger.info(`[${role.toUpperCase()}] Resuming timer`);

        if (timerState.localTimeLeftMs && timerState.localTimeLeftMs > 0) {
            const now = Date.now();

            setTimerState((prev: GameTimerState) => ({
                ...prev,
                status: 'play',
                timestamp: now
            }));

            if (config.enableLocalAnimation) {
                startTimeRef.current = now;
                initialDurationRef.current = timerState.localTimeLeftMs;
                startAnimationLoop();
            }
        }
    }, [role, timerState.localTimeLeftMs, config.enableLocalAnimation, startAnimationLoop]);

    const stop = useCallback(() => {
        logger.info(`[${role.toUpperCase()}] Stopping timer`);

        cleanup();

        setTimerState((prev: GameTimerState) => ({
            ...prev,
            status: 'stop',
            timeLeftMs: 0,
            localTimeLeftMs: 0,
            questionUid: undefined,
            timestamp: null
        }));
    }, [role, cleanup]);

    const reset = useCallback((duration?: number) => {
        logger.info(`[${role.toUpperCase()}] Resetting timer`);

        cleanup();

        const newDuration = duration || timerState.durationMs || TIMER_CONFIG.DEFAULT_QUESTION_TIME;

        setTimerState((prev: GameTimerState) => ({
            ...prev,
            status: 'stop',
            timeLeftMs: newDuration,
            durationMs: newDuration,
            localTimeLeftMs: newDuration,
            timestamp: null
        }));
    }, [role, timerState.durationMs, cleanup]);

    const setDuration = useCallback((duration: number) => {
        logger.info(`[${role.toUpperCase()}] Setting timer duration to ${duration}s`);

        setTimerState((prev: GameTimerState) => ({
            ...prev,
            durationMs: duration,
            timeLeftMs: prev.status === 'stop' ? duration : prev.timeLeftMs,
            localTimeLeftMs: prev.status === 'stop' ? duration : prev.localTimeLeftMs
        }));
    }, [role]);

    // --- Backend Synchronization ---
    const syncWithBackend = useCallback((payload: TimerUpdatePayload | GameTimerUpdatePayload) => {
        logTimerEvent('syncWithBackend_called', {
            role,
            payload,
            payloadType: typeof payload,
            payloadKeys: payload ? Object.keys(payload) : null,
            hasTimeLeftMs: 'timeLeftMs' in payload,
            hasRunning: 'running' in payload,
            hasTimer: 'timer' in payload
        });

        logTimerState('syncWithBackend_current_state_before', timerState);

        logger.debug(`[${role.toUpperCase()}] Syncing timer with backend`, payload);

        // Handle TimerUpdatePayload (standardized format)
        if ('timeLeftMs' in payload && 'running' in payload) {
            const timerUpdate = payload as TimerUpdatePayload;

            logTimerCalculation('processing_timer_update_payload', {
                timeLeftMs: timerUpdate.timeLeftMs,
                timeLeftType: typeof timerUpdate.timeLeftMs,
                running: timerUpdate.running,
                runningType: typeof timerUpdate.running,
                status: timerUpdate.status,
                durationMs: timerUpdate.durationMs,
                questionUid: timerUpdate.questionUid
            });

            // Always use status from payload if present, fallback to running
            let newStatus: TimerStatus = timerUpdate.status || (timerUpdate.running ? 'play' : 'stop');

            // TimerUpdatePayload.timeLeftMs is expected to be in milliseconds
            const timeLeftInMs = timerUpdate.timeLeftMs || 0;

            logTimerCalculation('calculated_timer_state', {
                newStatus,
                timeLeftInMs,
                willStartCountdown: timerUpdate.running && timeLeftInMs > 0
            });

            const newTimerState = {
                status: newStatus,
                timeLeftMs: timeLeftInMs,
                durationMs: timerUpdate.durationMs || timerState.durationMs,
                questionUid: timerUpdate.questionUid || timerState.questionUid || undefined,
                timestamp: Date.now(),
                localTimeLeftMs: timeLeftInMs // timeLeftMs is in milliseconds
            };

            logTimerState('setting_new_timer_state', newTimerState);

            setTimerState((prev: GameTimerState) => {
                logTimerState('setTimerState_prev', prev);
                const result = {
                    ...prev,
                    ...newTimerState
                };
                logTimerState('setTimerState_result', result);
                return result;
            });

            // Start/stop local countdown based on running state
            if (timerUpdate.running && timeLeftInMs > 0) {
                logTimerEvent('starting_local_countdown', { timeLeftInMs });
                startLocalCountdown(timeLeftInMs); // timeLeftMs is in milliseconds
            } else {
                logTimerEvent('cleanup_called', { running: timerUpdate.running, timeLeftInMs });
                cleanup();
            }
        }

        // Handle GameTimerUpdatePayload (backend timer object format)
        else if ('timer' in payload) {
            const gameTimerUpdate = payload as GameTimerUpdatePayload;

            // 🚨 EXTREME DEBUG: Log raw backend data
            console.warn('🚨 SYNC DEBUG: Raw backend timer data received', {
                'gameTimerUpdate': gameTimerUpdate,
                'gameTimerUpdate.timer': gameTimerUpdate.timer,
                'gameTimerUpdate.timer.timeRemainingMs': gameTimerUpdate.timer?.timeRemainingMs,
                'gameTimerUpdate.timer.isPaused': gameTimerUpdate.timer?.isPaused,
                'typeof gameTimerUpdate.timer?.timeRemainingMs': typeof gameTimerUpdate.timer?.timeRemainingMs,
                'JSON.stringify(gameTimerUpdate)': JSON.stringify(gameTimerUpdate)
            });

            const timer = gameTimerUpdate.timer;

            // Accept timeRemainingMs from backend
            let timeLeftMs = 0;
            if (typeof timer.timeRemainingMs === 'number') {
                timeLeftMs = timer.timeRemainingMs;
            } else {
                timeLeftMs = 0;
            }

            let status: TimerStatus = 'stop';
            if (timer.isPaused) {
                status = timeLeftMs === 0 ? 'stop' : 'pause';
            } else {
                status = timeLeftMs > 0 ? 'play' : 'stop';
            }

            setTimerState((prev: GameTimerState) => ({
                ...prev,
                status,
                timeLeftMs: timeLeftMs,
                durationMs: timer.durationMs || prev.durationMs,
                questionUid: gameTimerUpdate.questionUid || prev.questionUid,
                timestamp: Date.now(),
                localTimeLeftMs: timeLeftMs
            }));

            // Start/stop local countdown based on status
            if (status === 'play' && timeLeftMs > 0) {
                startLocalCountdown(timeLeftMs);
            } else {
                cleanup();
            }
        }
    }, [role, cleanup]);

    // --- Socket Event Integration ---
    useEffect(() => {
        if (!socket) return;

        // Create safe event handlers using type guards
        const handleTimerUpdate = createSafeEventHandler(
            (payload: TimerUpdatePayload) => {
                logger.debug(`[${role.toUpperCase()}] Received timer update`, payload);
                syncWithBackend(payload);
            },
            isTimerUpdatePayload,
            'timer_update'
        );

        const handleGameTimerUpdate = createSafeEventHandler(
            (payload: GameTimerUpdatePayload) => {
                logger.debug(`[${role.toUpperCase()}] Received game timer update`, payload);
                syncWithBackend(payload);
            },
            (data: unknown): data is GameTimerUpdatePayload => {
                return !!(data && typeof data === 'object' && 'timer' in data);
            },
            'game_timer_updated'
        );

        const handleDashboardTimerUpdate = createSafeEventHandler(
            (payload: GameTimerUpdatePayload) => {
                logger.debug(`[${role.toUpperCase()}] Received dashboard timer update`, payload);
                syncWithBackend(payload);
            },
            (data: unknown): data is GameTimerUpdatePayload => {
                return !!(data && typeof data === 'object' && 'timer' in data);
            },
            'dashboard_timer_updated'
        );

        // Register role-specific socket events
        const events: Array<{ event: string; handler: (data: unknown) => void }> = [];

        switch (role) {
            case 'teacher':
                events.push(
                    { event: SOCKET_EVENTS.TEACHER.TIMER_UPDATE, handler: handleTimerUpdate },
                    { event: SOCKET_EVENTS.TEACHER.DASHBOARD_TIMER_UPDATED, handler: handleDashboardTimerUpdate }
                );
                break;
            case 'student':
                events.push(
                    { event: SOCKET_EVENTS.GAME.TIMER_UPDATE, handler: handleTimerUpdate },
                    { event: SOCKET_EVENTS.GAME.GAME_TIMER_UPDATED, handler: handleGameTimerUpdate }
                );
                break;
            case 'projection':
                events.push(
                    { event: SOCKET_EVENTS.PROJECTOR.PROJECTION_TIMER_UPDATED, handler: handleGameTimerUpdate }
                );
                break;
            case 'tournament':
                events.push(
                    { event: SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_TIMER_UPDATE, handler: handleTimerUpdate }
                );
                break;
        }

        // Register event listeners
        events.forEach(({ event, handler }) => {
            socket.on(event, handler);
        });

        return () => {
            // Cleanup event listeners
            events.forEach(({ event, handler }) => {
                socket.off(event, handler);
            });
        };
    }, [socket, role, syncWithBackend]);

    // --- Time Formatting Utility ---
    const formatTime = useCallback((timeMs: number, showMs = false): string => {
        // Convert ms to seconds for display
        const time = timeMs / 1000;
        if (time <= 0) return showMs ? '0.0s' : '0s';
        if (showMs && time < 10) {
            return `${time.toFixed(1)}s`;
        }
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        if (minutes > 0) {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${seconds}s`;
    }, []);

    // --- Get Display Time (with role-specific logic) ---
    const getDisplayTime = useCallback((): number => {
        // For roles with local animation, prefer localTimeLeftMs
        if (config.enableLocalAnimation && timerState.localTimeLeftMs !== null) {
            return timerState.localTimeLeftMs;
        }
        // Fallback to timeLeftMs
        return timerState.timeLeftMs;
    }, [config.enableLocalAnimation, timerState.localTimeLeftMs, timerState.timeLeftMs]);

    // --- Cleanup on unmount ---
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    return {
        timerState,
        isRunning,
        start,
        pause,
        resume,
        stop,
        reset,
        setDuration,
        formatTime,
        syncWithBackend,
        getDisplayTime
    };
}

// --- Timer Utilities ---

/**
 * Create a timer hook configured for teacher role
 */
export function useTeacherTimer(socket?: Socket | null, customConfig?: Partial<TimerConfig>) {
    return useGameTimer('teacher', socket, customConfig);
}

/**
 * Create a timer hook configured for student role
 */
export function useStudentTimer(socket?: Socket | null, customConfig?: Partial<TimerConfig>) {
    return useGameTimer('student', socket, customConfig);
}

/**
 * Create a timer hook configured for projection role
 */
export function useProjectionTimer(socket?: Socket | null, customConfig?: Partial<TimerConfig>) {
    return useGameTimer('projection', socket, customConfig);
}

/**
 * Create a timer hook configured for tournament role
 */
export function useTournamentTimer(socket?: Socket | null, customConfig?: Partial<TimerConfig>) {
    return useGameTimer('tournament', socket, customConfig);
}
