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
export type TimerStatus = 'run' | 'pause' | 'stop';
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
    /**
     * Absolute timestamp (ms since epoch, UTC) when the timer is scheduled to end.
     * This is the canonical end date for the timer, used for backend/logic and precise signaling.
     * May be updated if the timer is changed during a quiz.
     */
    timerEndDateMs?: number;
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
    /**
     * Absolute timestamp (ms since epoch, UTC) when the timer is scheduled to end.
     * This is the canonical end date for the timer, used for backend/logic and precise signaling.
     * May be updated if the timer is changed during a quiz.
     */
    timerEndDateMs?: number;
}
/**
 * Game timer state interface
 * Comprehensive timer state for game sessions
 */
export interface GameTimerState {
    /** Timer status */
    status: TimerStatus;
    /** Canonical absolute end date (ms since epoch, UTC) */
    timerEndDateMs: number;
    /** Question UID associated with timer */
    questionUid: string;
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
    /** Timer object with canonical GameTimerState format */
    timer: GameTimerState;
    /** Question UID associated with the timer */
    questionUid?: string;
}
/**
 * Timer action payload interface
 * Payload for timer control actions
 */
export interface TimerActionPayload {
    /** Game access code (required for backend validation) */
    accessCode: string;
    /** Action to perform on timer (canonical: 'run', 'pause', 'stop', 'edit') */
    action: 'run' | 'pause' | 'stop' | 'edit';
    /**
     * Absolute timestamp (ms since epoch, UTC) when the timer is scheduled to end.
     * This is the canonical end date for the timer, used for backend/logic and precise signaling.
     * May be updated if the timer is changed during a quiz.
     */
    timerEndDateMs?: number;
    /**
     * Target time in milliseconds (duration or remaining time, NOT a date).
     * Used for UI, duration, or other timer logic. Distinct from timerEndDateMs.
     */
    targetTimeMs?: number;
    /** Question UID for question-specific timer operations (REQUIRED, canonical) */
    questionUid: string;
    /**
     * For 'edit' action: the new duration in milliseconds (REQUIRED for 'edit')
     */
    durationMs?: number;
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
