/**
 * clientLogger.ts - Client-side Logging Utility for MathQuest
 * 
 * This module provides a consistent logging interface for browser environments with:
 * - Multiple log levels (DEBUG, INFO, WARN, ERROR)
 * - Visual differentiation between log types
 * - Contextual prefixes for easier log filtering
 * - Environment-based configuration
 * 
 * Usage:
 *   import { createLogger } from './clientLogger';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
 *   const logger = createLogger('ComponentName');
 *   logger.debug('Detailed info for debugging');
 *   logger.info('Normal operation information');
 *   logger.warn('Warning that might need attention');
 *   logger.error('Error condition', errorObject);
 */

// Define log level type for type safety
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE';

// Global diagnostics buffer type (augmented on window when enabled)
declare global {
    interface Window {
        __mqDiag?: {
            enabled: boolean;
            // Use a permissive type to allow non-logger diagnostic entries
            events: any[];
            push: (entry: any) => void;
            download?: () => void;
            export?: () => any[];
            clear?: () => void;
        }
    }
}

// Log levels and their priorities
export const LOG_LEVELS: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

// Default log level is based on NODE_ENV at build time
const DEFAULT_LOG_LEVEL =
    process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

// Logger can be configured via environment variable
const getLogLevel = (): number => {
    // Handle server-side rendering safely
    if (typeof window === 'undefined') {
        // During SSR, use the build-time environment variable
        if (process.env.NEXT_PUBLIC_CLIENT_LOG_LEVEL) {
            const envLevel = process.env.NEXT_PUBLIC_CLIENT_LOG_LEVEL as LogLevel;
            return LOG_LEVELS[envLevel] ?? DEFAULT_LOG_LEVEL;
        }
        return DEFAULT_LOG_LEVEL;
    }

    try {
        // Check for runtime configuration in localStorage
        const storedLevel = localStorage.getItem('CLIENT_LOG_LEVEL') as LogLevel | null;
        if (storedLevel && storedLevel in LOG_LEVELS) {
            return LOG_LEVELS[storedLevel];
        }
    } catch (e) {
        // Handle localStorage exceptions (could be disabled)
        console.warn('Failed to access localStorage for logger settings');
    }

    // Use environment variables from Next.js
    // NEXT_PUBLIC vars are automatically injected by Next.js during build
    if (process.env.NEXT_PUBLIC_CLIENT_LOG_LEVEL) {
        const envLevel = process.env.NEXT_PUBLIC_CLIENT_LOG_LEVEL as LogLevel;
        return LOG_LEVELS[envLevel] ?? DEFAULT_LOG_LEVEL;
    }

    return DEFAULT_LOG_LEVEL;
};

// CSS styles for different log levels
const LOG_STYLES: Record<LogLevel | 'CONTEXT', string> = {
    DEBUG: 'color: #0099cc; font-weight: bold;', // Blue
    INFO: 'color: #00cc66; font-weight: bold;',  // Green
    WARN: 'color: #ffcc00; font-weight: bold;',  // Yellow
    ERROR: 'color: #ff3300; font-weight: bold;', // Red
    NONE: '',
    CONTEXT: 'color: #9370DB; font-weight: bold;' // Purple for context
};

function ensureDiagBuffer(): void {
    if (typeof window === 'undefined') return;
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const urlFlag = search && /(?:[?&])mqdebug=1(?:&|$)/.test(search);
    const lsFlag = (() => {
        try { return localStorage.getItem('MQ_DEBUG_CAPTURE') === '1'; } catch { return false; }
    })();
    const enabled = urlFlag || lsFlag;
    if (!window.__mqDiag) {
        window.__mqDiag = {
            enabled,
            events: [],
            push(entry) {
                // Cap at 5000 entries to avoid unbounded growth
                if (this.events.length > 5000) this.events.shift();
                this.events.push(entry);
            }
        };
    } else {
        // Keep existing buffer, just sync enabled flag
        window.__mqDiag.enabled = enabled || window.__mqDiag.enabled;
    }
    // Persist flag if url param present
    if (enabled) {
        try { localStorage.setItem('MQ_DEBUG_CAPTURE', '1'); } catch { }
    }
}

/**
 * Format the current timestamp
 * @returns {string} Formatted timestamp [HH:MM:SS.mmm]
 */
function getTimestamp(): string {
    const now = new Date();
    return `[${now.toTimeString().split(' ')[0]}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
}

/**
 * Get current log level (checks for dynamic configuration)
 */
export function getCurrentLogLevel(): LogLevel {
    const level = getLogLevel();
    return (Object.keys(LOG_LEVELS).find(
        key => LOG_LEVELS[key as LogLevel] === level
    ) as LogLevel) || 'INFO';
}

/**
 * Set the log level at runtime
 * @param level - The log level to set (DEBUG, INFO, WARN, ERROR, NONE)
 */
export function setLogLevel(level: LogLevel): void {
    if (typeof window === 'undefined') {
        return; // Can't set localStorage during SSR
    }

    try {
        if (level in LOG_LEVELS) {
            localStorage.setItem('CLIENT_LOG_LEVEL', level);
            console.log(`%c[Logger] Log level set to ${level}`, LOG_STYLES.INFO);
        }
    } catch (e) {
        console.warn('Failed to store log level in localStorage');
    }
}

// Logger interface
export interface Logger {
    debug: (message: unknown, ...args: unknown[]) => void;
    info: (message: unknown, ...args: unknown[]) => void;
    warn: (message: unknown, ...args: unknown[]) => void;
    error: (message: unknown, ...args: unknown[]) => void;
}

/**
 * Create a logger instance for a specific component
 * @param context - The name of the component using this logger
 * @returns Logger object with methods for each log level
 */
export function createLogger(context: string): Logger {
    // Initialize diagnostics buffer once in browser
    if (typeof window !== 'undefined') {
        ensureDiagBuffer();
    }
    // Common logging function
    const log = (level: LogLevel, message: unknown, ...args: unknown[]): void => {
        // Skip logging if disabled or below minimum level
        if (level === 'NONE' || LOG_LEVELS[level] < getLogLevel()) {
            return;
        }

        // Skip logging completely during SSR
        if (typeof window === 'undefined') {
            return;
        }

        const timestamp = getTimestamp();
        const levelStyle = LOG_STYLES[level] || '';
        const contextStyle = LOG_STYLES.CONTEXT;

        // Format: [Time] [LEVEL] [Context] Message
        if (level === 'ERROR') {
            console.error(
                `%c${timestamp}%c [${level}] %c[${context}]%c`,
                'color: gray;', levelStyle, contextStyle, '',
                message,
                ...args
            );
        } else {
            console.log(
                `%c${timestamp}%c [${level}] %c[${context}]%c`,
                'color: gray;', levelStyle, contextStyle, '',
                message,
                ...args
            );
        }

        // Also push to diagnostics buffer if enabled
        try {
            if (typeof window !== 'undefined') {
                const buf = window.__mqDiag;
                if (buf && buf.enabled && typeof buf.push === 'function') {
                    buf.push({ ts: Date.now(), level, context, message, args });
                }
            }
        } catch {
            // ignore diagnostics push errors
        }
    };

    return {
        debug: (message: unknown, ...args: unknown[]) => log('DEBUG', message, ...args),
        info: (message: unknown, ...args: unknown[]) => log('INFO', message, ...args),
        warn: (message: unknown, ...args: unknown[]) => log('WARN', message, ...args),
        error: (message: unknown, ...args: unknown[]) => log('ERROR', message, ...args)
    };
}

// Create a default logger for quick access
export const logger = createLogger('App');

// Create a method to make a logger instance quiet (put at top of your component if it renders too much during development)
export function quietLogger(context: string): Logger {
    return {
        debug: () => { },
        info: () => { },
        warn: () => { },
        error: () => { }
    };
}