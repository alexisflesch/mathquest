/**
 * Global application configuration
 * 
 * This file centralizes all configuration values that might change between environments
 * (local development, staging, production).
 */

// Backend API URL from environment variable with fallback for local dev
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3007';

// Socket.IO configuration
export const SOCKET_CONFIG = {
    url: API_URL,
    path: '/api/socket/io',
    transports: ['websocket', 'polling'] as string[],  // Allow fallback to polling if websocket fails
    reconnectionAttempts: 10,           // More reconnection attempts
    reconnectionDelay: 1000,            // Start with 1s delay
    reconnectionDelayMax: 10000,        // Maximum 10s delay between retries
    timeout: 30000,                     // Longer connection timeout (30s)
    forceNew: true,                     // Force a new connection
    autoConnect: true,                  // Automatically connect
    withCredentials: false,             // Don't send credentials with cross-domain requests
    extraHeaders: {                     // Custom headers for troubleshooting
        "X-Client-Version": "1.0.0",
        "X-Client-Source": "frontend"
    }
};
