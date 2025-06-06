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

import { useState, useRef, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { TIMER_CONFIG, UI_CONFIG } from '@/config/gameConfig';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

const logger = createLogger('useGameTimer');

// --- Timer Role Types ---
export type TimerRole = 'teacher' | 'student' | 'projection' | 'tournament';

// --- Timer Status Types ---
export type TimerStatus = 'play' | 'pause' | 'stop';

// --- Timer State Interface ---
export interface TimerState {
    status: TimerStatus;
    timeLeft: number;
    duration: number;
    questionId: string | null;
    timestamp: number | null;
    localTimeLeft: number | null;
}

// --- Timer Configuration Interface ---
export interface TimerConfig {
    role: TimerRole;
    autoStart?: boolean;
    smoothCountdown?: boolean;
    showMilliseconds?: boolean;
    enableLocalAnimation?: boolean;
    updateThreshold?: number;
}

// --- Timer Hook Interface ---
export interface GameTimerHook {
    // State
    timerState: TimerState;
    isRunning: boolean;

    // Actions
    start: (questionId: string, duration?: number) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    reset: (duration?: number) => void;
    setDuration: (duration: number) => void;

    // Time formatting utilities
    formatTime: (time: number, showMs?: boolean) => string;

    // Role-specific methods
    syncWithBackend: (backendState: Partial<TimerState>) => void;
    getDisplayTime: () => number;
}

// --- Default Timer Configurations by Role ---
const DEFAULT_CONFIGS: Record<TimerRole, TimerConfig> = {
    teacher: {
        role: 'teacher',
        autoStart: false,
        smoothCountdown: false,
        showMilliseconds: false,
        enableLocalAnimation: false,
        updateThreshold: UI_CONFIG.LEADERBOARD_UPDATE_INTERVAL
    },
    student: {
        role: 'student',
        autoStart: true,
        smoothCountdown: true,
        showMilliseconds: false,
        enableLocalAnimation: true,
        updateThreshold: TIMER_CONFIG.UI_UPDATE_INTERVAL
    },
    projection: {
        role: 'projection',
        autoStart: true,
        smoothCountdown: true,
        showMilliseconds: true,
        enableLocalAnimation: true,
        updateThreshold: TIMER_CONFIG.UI_UPDATE_INTERVAL
    },
    tournament: {
        role: 'tournament',
        autoStart: true,
        smoothCountdown: true,
        showMilliseconds: false,
        enableLocalAnimation: true,
        updateThreshold: TIMER_CONFIG.UI_UPDATE_INTERVAL
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

    // Merge default config with custom overrides
    const config: TimerConfig = {
        ...DEFAULT_CONFIGS[role],
        ...customConfig
    };

    // --- Timer State ---
    const [timerState, setTimerState] = useState<TimerState>({
        status: 'stop',
        timeLeft: 0,
        duration: TIMER_CONFIG.DEFAULT_QUESTION_TIME,
        questionId: null,
        timestamp: null,
        localTimeLeft: null
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
    const updateLocalTimeLeft = useCallback((newTimeLeft: number) => {
        const now = Date.now();
        const previousValue = localTimeLeftRef.current;

        // Always update the ref value
        localTimeLeftRef.current = newTimeLeft;

        // Only update state if enough time has passed or value changed significantly
        const threshold = config.updateThreshold || UI_CONFIG.LEADERBOARD_UPDATE_INTERVAL;

        if (
            now - lastUpdateTimeRef.current >= threshold ||
            Math.abs((previousValue || 0) - newTimeLeft) > 1
        ) {
            setTimerState(prev => ({
                ...prev,
                localTimeLeft: newTimeLeft
            }));
            lastUpdateTimeRef.current = now;
        }
    }, [config.updateThreshold]);

    // --- Animation Loop for Smooth Countdown ---
    const startAnimationLoop = useCallback(() => {
        if (!config.enableLocalAnimation) return;

        const tick = () => {
            if (startTimeRef.current === null || initialDurationRef.current === null) return;

            const now = Date.now();
            const elapsed = (now - startTimeRef.current) / 1000;
            const remaining = Math.max(initialDurationRef.current - elapsed, 0);
            const roundedRemaining = config.showMilliseconds ? remaining : Math.ceil(remaining);

            updateLocalTimeLeft(roundedRemaining);

            if (remaining > 0 && timerState.status === 'play') {
                animationFrameRef.current = requestAnimationFrame(tick);
            } else if (remaining <= 0) {
                // Timer expired
                setTimerState(prev => ({
                    ...prev,
                    status: 'stop',
                    timeLeft: 0,
                    localTimeLeft: 0
                }));
                cleanup();
            }
        };

        animationFrameRef.current = requestAnimationFrame(tick);
    }, [config.enableLocalAnimation, config.showMilliseconds, timerState.status, updateLocalTimeLeft, cleanup]);

    // --- Timer Actions ---
    const start = useCallback((questionId: string, duration?: number) => {
        logger.info(`[${role.toUpperCase()}] Starting timer for question ${questionId}`);

        cleanup();

        const timerDuration = duration || timerState.duration || TIMER_CONFIG.DEFAULT_QUESTION_TIME;
        const now = Date.now();

        setTimerState(prev => ({
            ...prev,
            status: 'play',
            questionId,
            duration: timerDuration,
            timeLeft: timerDuration,
            timestamp: now,
            localTimeLeft: timerDuration
        }));

        if (config.enableLocalAnimation) {
            startTimeRef.current = now;
            initialDurationRef.current = timerDuration;
            startAnimationLoop();
        }
    }, [role, timerState.duration, cleanup, config.enableLocalAnimation, startAnimationLoop]);

    const pause = useCallback(() => {
        logger.info(`[${role.toUpperCase()}] Pausing timer`);

        cleanup();

        setTimerState(prev => ({
            ...prev,
            status: 'pause',
            timestamp: Date.now()
        }));
    }, [role, cleanup]);

    const resume = useCallback(() => {
        logger.info(`[${role.toUpperCase()}] Resuming timer`);

        if (timerState.localTimeLeft && timerState.localTimeLeft > 0) {
            const now = Date.now();

            setTimerState(prev => ({
                ...prev,
                status: 'play',
                timestamp: now
            }));

            if (config.enableLocalAnimation) {
                startTimeRef.current = now;
                initialDurationRef.current = timerState.localTimeLeft;
                startAnimationLoop();
            }
        }
    }, [role, timerState.localTimeLeft, config.enableLocalAnimation, startAnimationLoop]);

    const stop = useCallback(() => {
        logger.info(`[${role.toUpperCase()}] Stopping timer`);

        cleanup();

        setTimerState(prev => ({
            ...prev,
            status: 'stop',
            timeLeft: 0,
            localTimeLeft: 0,
            questionId: null,
            timestamp: null
        }));
    }, [role, cleanup]);

    const reset = useCallback((duration?: number) => {
        logger.info(`[${role.toUpperCase()}] Resetting timer`);

        cleanup();

        const newDuration = duration || timerState.duration || TIMER_CONFIG.DEFAULT_QUESTION_TIME;

        setTimerState(prev => ({
            ...prev,
            status: 'stop',
            timeLeft: newDuration,
            duration: newDuration,
            localTimeLeft: newDuration,
            timestamp: null
        }));
    }, [role, timerState.duration, cleanup]);

    const setDuration = useCallback((duration: number) => {
        logger.info(`[${role.toUpperCase()}] Setting timer duration to ${duration}s`);

        setTimerState(prev => ({
            ...prev,
            duration,
            timeLeft: prev.status === 'stop' ? duration : prev.timeLeft,
            localTimeLeft: prev.status === 'stop' ? duration : prev.localTimeLeft
        }));
    }, [role]);

    // --- Backend Synchronization ---
    const syncWithBackend = useCallback((backendState: Partial<TimerState>) => {
        logger.debug(`[${role.toUpperCase()}] Syncing with backend state`, backendState);

        setTimerState(prev => {
            const newState = { ...prev, ...backendState };

            // Handle status changes
            if (backendState.status && backendState.status !== prev.status) {
                if (backendState.status === 'play' && config.enableLocalAnimation) {
                    // Start local animation
                    cleanup();
                    const now = Date.now();
                    startTimeRef.current = now;
                    initialDurationRef.current = newState.timeLeft || 0;
                    startAnimationLoop();
                } else if (backendState.status !== 'play') {
                    cleanup();
                }
            }

            return newState;
        });
    }, [role, config.enableLocalAnimation, cleanup, startAnimationLoop]);

    // --- Socket Event Integration ---
    useEffect(() => {
        if (!socket) return;

        const handleTimerUpdate = (data: any) => {
            logger.debug(`[${role.toUpperCase()}] Received timer update`, data);

            // Extract timer data based on different event structures
            let status: TimerStatus = 'stop';
            let timeLeft = 0;
            let questionId: string | null = null;

            // Handle different event data formats
            if (data.status) {
                status = data.status;
            }
            if (typeof data.timeLeft === 'number') {
                timeLeft = data.timeLeft;
            }
            if (data.questionId) {
                questionId = data.questionId;
            }

            // Handle game timer update format (nested timer object)
            if (data.timer) {
                const timerObj = data.timer;
                if (timerObj.isPaused) {
                    status = 'pause';
                    timeLeft = typeof timerObj.timeRemaining === 'number' ? Math.ceil(timerObj.timeRemaining / 1000) : 0;
                } else if (typeof timerObj.startedAt === 'number' && typeof timerObj.duration === 'number') {
                    const elapsed = Date.now() - timerObj.startedAt;
                    const remaining = Math.max(0, timerObj.duration - elapsed);
                    timeLeft = Math.ceil(remaining / 1000);
                    status = 'play';
                }
            }

            // Sync with backend
            syncWithBackend({
                status,
                timeLeft,
                questionId,
                timestamp: Date.now()
            });
        };

        // Register role-specific socket events
        const events: string[] = [];
        switch (role) {
            case 'teacher':
                events.push(SOCKET_EVENTS.TEACHER.TIMER_UPDATE);
                events.push(SOCKET_EVENTS.TEACHER.DASHBOARD_TIMER_UPDATED);
                break;
            case 'student':
                events.push(SOCKET_EVENTS.GAME.TIMER_UPDATE);
                events.push(SOCKET_EVENTS.GAME.GAME_TIMER_UPDATED);
                break;
            case 'projection':
                events.push(SOCKET_EVENTS.PROJECTOR.PROJECTION_TIMER_UPDATED);
                break;
            case 'tournament':
                events.push(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_TIMER_UPDATE);
                break;
        }

        // Register event listeners
        events.forEach(event => {
            socket.on(event, handleTimerUpdate);
        });

        return () => {
            // Cleanup event listeners
            events.forEach(event => {
                socket.off(event, handleTimerUpdate);
            });
        };
    }, [socket, role, syncWithBackend]);

    // --- Time Formatting Utility ---
    const formatTime = useCallback((time: number, showMs = false): string => {
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
        // For roles with local animation, prefer localTimeLeft
        if (config.enableLocalAnimation && timerState.localTimeLeft !== null) {
            return timerState.localTimeLeft;
        }

        // Fallback to timeLeft
        return timerState.timeLeft;
    }, [config.enableLocalAnimation, timerState.localTimeLeft, timerState.timeLeft]);

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
