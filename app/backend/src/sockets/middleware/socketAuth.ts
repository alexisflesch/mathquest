import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '@/middleware/auth';
import createLogger from '@/utils/logger';

// Create a middleware-specific logger
const logger = createLogger('SocketAuth');

// JWT secret key should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'mathquest_default_secret';

/**
 * Socket.IO authentication middleware
 * This middleware authenticates teachers and identifies players
 * @param socket The Socket.IO socket
 * @param next Callback to proceed to the next middleware
 */
export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
    try {
        // Accept userId and role from both auth and query for compatibility
        const userId = socket.handshake.auth.userId || socket.handshake.query.userId;
        const userType = socket.handshake.auth.userType || socket.handshake.query.userType;
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        // --- PATCH: Accept teacherId from auth or query for test/dev compatibility ---
        const teacherId = socket.handshake.auth.teacherId || socket.handshake.query.teacherId;
        if (teacherId) {
            socket.data.teacherId = teacherId;
            socket.data.user = {
                teacherId,
                role: 'teacher'
            };
            logger.debug({ teacherId, socketId: socket.id }, 'Teacher socket authenticated via teacherId (test/dev mode)');
        }
        // --- END PATCH ---

        // Store connection info for debugging
        const connectionInfo = {
            id: socket.id,
            address: socket.handshake.address,
            userAgent: socket.request.headers['user-agent'],
            time: new Date().toISOString()
        };

        // Direct authentication for testing
        if (userId && userType === 'teacher') {
            // This is for test environment direct authentication
            socket.data.user = {
                userId: userId,
                role: 'TEACHER'
            };
            logger.debug({ userId: userId, socketId: socket.id }, 'Teacher socket authenticated directly (test mode)');
        }
        // If a token is provided, try to authenticate as a teacher
        else if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

                // Attach the user data to the socket
                socket.data.user = {
                    userId: decoded.userId,
                    username: decoded.username,
                    role: decoded.role
                };

                logger.debug({ userId: decoded.userId, socketId: socket.id }, 'Teacher socket authenticated');
            } catch (err) {
                logger.warn({ err, socketId: socket.id }, 'Invalid token in socket connection');
                // Don't reject the connection, just don't attach user data
            }
        }

        // If a player ID is provided, store it with the socket
        if (userId) {
            socket.data.user = {
                ...socket.data.user,
                userId,
                role: socket.data.user?.role || 'player'
            };

            logger.debug({ userId, socketId: socket.id }, 'Player socket identified');
        }

        // If neither token nor userId is provided
        if (!token && !userId) {
            logger.debug({ socketId: socket.id }, 'Anonymous socket connection');
            // We still allow anonymous connections, they just won't have access to protected events
        }

        // Store connection info in socket data for potential later use
        socket.data.connectionInfo = connectionInfo;

        // Always proceed - authorization is handled at the event level
        next();
    } catch (error) {
        logger.error({ error, socketId: socket.id }, 'Error in socket authentication');
        next();
    }
};
