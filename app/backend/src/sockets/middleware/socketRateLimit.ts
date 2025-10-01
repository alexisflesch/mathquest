import { Socket } from 'socket.io';
import createLogger from '@/utils/logger';

// Create a middleware-specific logger
const logger = createLogger('SocketRateLimit');

// Rate limiting configuration - configurable via environment variables
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_CONNECTIONS_PER_WINDOW = parseInt(process.env.MAX_CONNECTIONS_PER_WINDOW || '2000'); // Configurable max connections per IP per minute
const MAX_EVENTS_PER_SECOND = parseInt(process.env.MAX_EVENTS_PER_SECOND || '100'); // Configurable max events per socket per second (reasonable for gaming)

// In-memory storage for rate limiting (in production, use Redis)
interface RateLimitData {
    connections: number;
    lastConnectionReset: number;
    events: number;
    lastEventReset: number;
}

const rateLimitStore = new Map<string, RateLimitData>();

/**
 * Clean up old entries from the rate limit store
 */
function cleanupOldEntries() {
    const now = Date.now();
    const cutoff = now - RATE_LIMIT_WINDOW_MS * 2; // Keep entries for 2 windows

    for (const [key, data] of rateLimitStore.entries()) {
        if (data.lastConnectionReset < cutoff && data.lastEventReset < cutoff) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Get or create rate limit data for an IP address
 */
function getRateLimitData(ip: string): RateLimitData {
    let data = rateLimitStore.get(ip);
    const now = Date.now();

    if (!data) {
        data = {
            connections: 0,
            lastConnectionReset: now,
            events: 0,
            lastEventReset: now
        };
        rateLimitStore.set(ip, data);
    }

    // Reset counters if window has passed
    if (now - data.lastConnectionReset > RATE_LIMIT_WINDOW_MS) {
        data.connections = 0;
        data.lastConnectionReset = now;
    }

    if (now - data.lastEventReset > 1000) { // 1 second window for events
        data.events = 0;
        data.lastEventReset = now;
    }

    return data;
}

/**
 * Socket.IO rate limiting middleware
 * Prevents DoS attacks by limiting connection frequency and event rates
 */
export const socketRateLimitMiddleware = (socket: Socket, next: (err?: Error) => void) => {
    try {
        // Get client IP address
        const clientIp = socket.handshake.address || 'unknown';

        // Clean up old entries periodically
        if (Math.random() < 0.01) { // 1% chance to cleanup on each connection
            cleanupOldEntries();
        }

        const rateLimitData = getRateLimitData(clientIp);

        // Check connection rate limit
        if (rateLimitData.connections >= MAX_CONNECTIONS_PER_WINDOW) {
            logger.warn('Socket connection rate limit exceeded', {
                ip: clientIp,
                connections: rateLimitData.connections,
                socketId: socket.id
            });
            return next(new Error('Connection rate limit exceeded. Please try again later.'));
        }

        // Increment connection counter
        rateLimitData.connections++;

        // Store rate limit data for event rate limiting
        (socket as any).rateLimitData = rateLimitData;

        logger.debug('Socket connection allowed', {
            ip: clientIp,
            connections: rateLimitData.connections,
            socketId: socket.id
        });

        next();
    } catch (error) {
        logger.error('Error in socket rate limiting middleware', {
            error: error instanceof Error ? error.message : String(error),
            socketId: socket.id
        });
        next(new Error('Rate limiting error'));
    }
};

/**
 * Event rate limiting function to be called on each socket event
 * This should be integrated into the socket event handlers
 */
export function checkEventRateLimit(socket: Socket): boolean {
    const rateLimitData = (socket as any).rateLimitData as RateLimitData | undefined;

    if (!rateLimitData) {
        logger.warn('No rate limit data found for socket', { socketId: socket.id });
        return false; // Block if no rate limit data
    }

    const now = Date.now();

    // Reset event counter if window has passed
    if (now - rateLimitData.lastEventReset > 1000) {
        rateLimitData.events = 0;
        rateLimitData.lastEventReset = now;
    }

    // Check event rate limit
    if (rateLimitData.events >= MAX_EVENTS_PER_SECOND) {
        logger.warn('Socket event rate limit exceeded', {
            socketId: socket.id,
            events: rateLimitData.events,
            ip: socket.handshake.address
        });
        return false;
    }

    // Increment event counter
    rateLimitData.events++;

    return true;
}