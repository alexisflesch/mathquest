import { STORAGE_KEYS } from '@/constants/auth';
import { SocketConfig } from '@/types/socket';

/**
 * Format time for display (expects milliseconds, converts to MM:SS format)
 * @param timeInMs - Time in milliseconds
 * @returns Formatted time string in MM:SS format
 */
export function formatTime(timeInMs: number): string {
    // Convert milliseconds to seconds
    const totalSeconds = Math.ceil(timeInMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * Get authentication data for socket connection
 * Returns token for JWT auth or fallback data for compatibility
 */
export function getSocketAuth(): Record<string, string> | null {
    if (typeof window === 'undefined') {
        return null;
    }

    // Try to get JWT token first (new auth system)
    const token = localStorage.getItem('mathquest_jwt_token');
    if (token) {
        return {
            token
        };
    }

    // Fallback to legacy auth data for compatibility
    const teacherId = localStorage.getItem(STORAGE_KEYS.TEACHER_ID);
    const cookieId = localStorage.getItem('mathquest_cookie_id');

    if (teacherId) {
        const auth: Record<string, string> = {
            userId: teacherId,
            userType: 'teacher'
        };
        // Include cookie_id only if it exists
        if (cookieId) {
            auth.cookie_id = cookieId;
        }
        return auth;
    }

    // No authentication data available
    return null;
}

/**
 * Create socket configuration with authentication
 */
export function createSocketConfig(baseConfig: SocketConfig): SocketConfig {
    const auth = getSocketAuth();

    return {
        ...baseConfig,
        auth: auth || undefined,
        // Also pass auth data in query for backend compatibility
        query: auth || undefined
    };
}
/**
// --- CANONICAL TIMER UTILITIES ---
// All timer utilities must use canonical shared types from shared/types/core/timer.ts
import type { GameTimerState, TimerStatus } from '@shared/types/core/timer';

/**
 * Canonical timer conversion utilities (all ms, no legacy/seconds)
 * Use only canonical timer fields and types.
 */
export const timerUtils = {
    /** Convert milliseconds to seconds for display (rounds up) */
    msToSecondsDisplay: (ms: number | null): number => {
        if (ms == null) return 0;
        return Math.ceil(ms / 1000);
    },

    /** Convert seconds to milliseconds for internal use (canonical: always ms) */
    secondsToMs: (seconds: number): number => {
        return seconds * 1000;
    },

    /** Format milliseconds as MM:SS (canonical display) */
    formatMsAsMMSS: (ms: number | null): string => {
        if (ms == null) return '-';
        const totalSeconds = Math.ceil(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
};

// --- END CANONICAL TIMER UTILITIES ---
