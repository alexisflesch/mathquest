/**
 * Global application configuration
 * 
 * This file centralizes all configuration values that might change between environments
 * (local development, staging, production).
 */

import { SOCKET_TIMING_CONFIG } from '@/config/gameConfig';

// Backend API URL from environment variable with fallback for local dev
export const API_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3007';

// Socket.IO configuration - now using centralized timing values
export const SOCKET_CONFIG = {
    url: API_URL,
    path: '/api/socket.io',            // Updated to match backend path
    transports: ['websocket', 'polling'] as string[],  // Allow fallback to polling if websocket fails
    reconnectionAttempts: 10,           // More reconnection attempts
    reconnectionDelay: SOCKET_TIMING_CONFIG.RECONNECTION_DELAY,
    reconnectionDelayMax: SOCKET_TIMING_CONFIG.RECONNECTION_DELAY_MAX,
    timeout: SOCKET_TIMING_CONFIG.CONNECTION_TIMEOUT,
    forceNew: true,                     // Force a new connection
    autoConnect: false,                 // Don't auto-connect, we'll handle auth first
    withCredentials: true,              // Send credentials for authentication
    extraHeaders: {                     // Custom headers for troubleshooting
        "X-Client-Version": "1.0.0",
        "X-Client-Source": "frontend"
    }
};
