/**
 * Core Timer Types
 *
 * Consolidated timer-related type definitions to eliminate duplication
 * across the MathQuest codebase. These are the canonical should be used throughout the application.
 */
/**
 * Timer status enumeration
 * Represents the current state of any timer
 */
export type TimerStatus = 'play' | 'pause' | 'stop';
/**
 * Timer role enumeration
 * Defines different contexts where timers are used
 */
export type TimerRole = 'teacher' | 'student' | 'projection' | 'tournament';
/**
 * Base timer interface
 * Core timer properties shared across all timer implementations
 */
export interface BaseTimer {
    /** Current timer status */
    status: TimerStatus;
    /** Time remaining in milliseconds (null if not set) */
    timeLeftMs: number | null;
    /** Whether timer is currently running */
    running: boolean;
}
/**
 * Chrono timer interface
 * Used for quiz timing and general chronometer functionality
 */
export interface Chrono extends BaseTimer {
    /** Optional duration for reference in milliseconds */
    durationMs?: number;
    /** Question UID associated with this timer */
    questionUid?: string;
}
/**
 * Question timer interface
 * Specific timer implementation for question timing
 */
export interface QuestionTimer {
    /** Timer status */
    status: TimerStatus;
    /** Time remaining in milliseconds */
    timeLeftMs: number;
    /** Initial timer duration in milliseconds */
    initialTimeMs: number;
    /** Timestamp when timer was last updated */
    timestamp: number | null;
    /** Question UID this timer is associated with */
    questionUid?: string;
}
/**
 * Game timer state interface
 * Comprehensive timer state for game sessions
 */
export interface GameTimerState {
    /** Timer status */
    status: TimerStatus;
    /** Time remaining in milliseconds */
    timeLeftMs: number;
    /** Total timer duration in milliseconds */
    durationMs: number;
    /** Question UID associated with timer */
    questionUid: string | null | undefined;
    /** Server timestamp for synchronization */
    timestamp: number | null;
    /** Local countdown time for smooth UI updates in milliseconds */
    localTimeLeftMs: number | null;
    /** Whether timer is currently running/active */
    isRunning?: boolean;
    /** Display format preference for UI */
    displayFormat?: 'mm:ss' | 'ss' | 'ms';
    /** Whether to show milliseconds in UI */
    showMilliseconds?: boolean;
    /** Timestamp when timer was started */
    startedAt?: number;
    /** Timestamp when timer was paused */
    pausedAt?: number;
}
/**
 * Timer configuration interface
 * Configuration options for timer behavior
 */
export interface TimerConfig {
    /** Role/context of the timer */
    role: TimerRole;
    /** Whether timer should auto-start */
    autoStart?: boolean;
    /** Enable smooth countdown animations */
    smoothCountdown?: boolean;
    /** Show milliseconds in display */
    showMilliseconds?: boolean;
    /** Enable local countdown animations */
    enableLocalAnimation?: boolean;
    /** Threshold for timer updates */
    updateThreshold?: number;
}
/**
 * Timer update payload interface
 * Used for socket events communicating timer changes
 */
export interface TimerUpdatePayload {
    /** Time remaining in milliseconds */
    timeLeftMs: number | null;
    /** Whether timer is running */
    running: boolean;
    /** Timer duration in milliseconds (optional) */
    durationMs?: number;
    /** Associated question UID */
    questionUid?: string;
    /** Timer status */
    status?: TimerStatus;
}
/**
 * Game timer update payload interface
 * Specific payload for game timer socket events
 */
export interface GameTimerUpdatePayload {
    /** Timer object with state */
    timer: {
        /** Whether timer is paused */
        isPaused: boolean;
        /** Time remaining in milliseconds (canonical) */
        timeLeftMs?: number;
        /** When timer was started (timestamp) */
        startedAt?: number;
        /** Timer duration in milliseconds */
        durationMs?: number;
    };
    /** Question UID associated with the timer */
    questionUid?: string;
}
/**
 * Timer action payload interface
 * Payload for timer control actions
 */
export interface TimerActionPayload {
    /** Game access code */
    accessCode?: string;
    /** Game ID for database operations */
    gameId?: string;
    /** Action to perform on timer */
    action: 'start' | 'pause' | 'resume' | 'stop' | 'set_duration';
    /** Duration in milliseconds (converted from user input seconds) */
    durationMs?: number;
    /** Question UID for question-specific timer operations */
    questionUid?: string;
}
/**
 * Legacy timer interfaces for backward compatibility
 */
/**
 * @deprecated Use BaseTimer instead
 */
export interface LegacyChrono {
    timeLeft: number | null;
    running: boolean;
    status?: TimerStatus;
}
/**
 * @deprecated Use GameTimerState instead
 */
export interface LegacyTimerState {
    status: TimerStatus;
    timeLeft: number;
    duration: number;
    questionUid: string | null | undefined;
    timestamp: number | null;
    localTimeLeft: number | null;
}
