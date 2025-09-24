/**
 * Shared Logger Interface
 * 
 * This interface is used to provide consistent typing for the logger
 * created by the createLogger function from shared/logger.ts.
 */

/**
 * Logger interface for consistent logging across frontend and backend
 */
export interface Logger {
    debug: (message: string, context?: unknown) => void;
    info: (message: string, context?: unknown) => void;
    warn: (message: string, context?: unknown) => void;
    error: (message: string, context?: unknown) => void;
}
