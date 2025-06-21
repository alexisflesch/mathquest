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
 * Explicit Timer Unit Conversion Utilities
 * These functions make unit conversions explicit and prevent confusion
 */
export const timerConversions = {
    /** Convert milliseconds to seconds for display (rounds up) */
    msToSecondsDisplay: (ms: number | null): number => {
        if (ms === null) return 0;
        return Math.ceil(ms / 1000);
    },

    /** Convert seconds to milliseconds for internal use */
    secondsToMsInternal: (seconds: number): number => {
        return seconds * 1000;
    },

    /** Format milliseconds as MM:SS or SS display string */
    formatMsAsSeconds: (ms: number | null): string => {
        if (ms === null) return '-';
        const seconds = Math.ceil(ms / 1000);
        if (seconds >= 60) {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${m}:${s.toString().padStart(2, '0')}`;
        }
        return seconds.toString();
    }
};
