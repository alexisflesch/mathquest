import { STORAGE_KEYS } from '@/constants/auth';
import { SocketConfig } from '@/types/socket';

export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
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