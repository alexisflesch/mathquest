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
        logger.warn({
            socketId: socket.id,
            auth: socket.handshake.auth,
            query: socket.handshake.query,
            headers: socket.handshake.headers
        }, 'SOCKET AUTH: handshake received');

        // Accept userId and role from both auth and query for compatibility
        const userId = socket.handshake.auth.userId || socket.handshake.query.userId;
        const userType = socket.handshake.auth.userType || socket.handshake.query.userType;
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        logger.warn({
            socketId: socket.id,
            userId,
            userType,
            tokenPrefix: token ? token.substring(0, 20) + '...' : null
        }, 'SOCKET AUTH: extracted handshake fields');

        // Also check for JWT token in cookies (for web browser connections)
        let cookieToken = null;
        if (socket.handshake.headers.cookie) {
            const cookies = socket.handshake.headers.cookie;
            const teacherTokenMatch = cookies.match(/teacherToken=([^;]+)/);
            const authTokenMatch = cookies.match(/authToken=([^;]+)/);
            cookieToken = teacherTokenMatch?.[1] || authTokenMatch?.[1] || null;
        }
        logger.warn({
            socketId: socket.id,
            cookieTokenPrefix: cookieToken ? cookieToken.substring(0, 20) + '...' : null
        }, 'SOCKET AUTH: extracted cookie token');

        logger.warn({
            socketId: socket.id,
            auth: socket.handshake.auth,
            query: socket.handshake.query,
            userId,
            userType,
            hasToken: !!(token || cookieToken),
            tokenPrefix: (token || cookieToken)?.substring(0, 20) + '...' || null,
            hasCookieToken: !!cookieToken,
            cookieTokenPrefix: cookieToken?.substring(0, 20) + '...' || null
        }, 'SOCKET AUTH: authentication attempt');

        // Store connection info for debugging
        const connectionInfo = {
            id: socket.id,
            address: socket.handshake.address,
            userAgent: socket.request.headers['user-agent'],
            time: new Date().toISOString()
        };

        // Initialize user data - will be populated based on available auth info
        let userData: any = {};
        let finalUserId = null;

        // If a token is provided (from auth/query or cookies), try to authenticate as a teacher
        if (token || cookieToken) {
            const actualToken = token || cookieToken;
            try {
                logger.warn({
                    tokenLength: actualToken!.length,
                    tokenSource: token ? 'auth/query' : 'cookie',
                    socketId: socket.id
                }, 'SOCKET AUTH: Attempting JWT verification');
                const decoded = jwt.verify(actualToken!, JWT_SECRET) as JwtPayload;

                logger.warn({
                    decoded,
                    tokenSource: token ? 'auth/query' : 'cookie',
                    socketId: socket.id
                }, 'SOCKET AUTH: JWT decoded payload');

                // Use data from JWT token
                userData = {
                    userId: decoded.userId,
                    username: decoded.username,
                    role: decoded.role
                };
                finalUserId = decoded.userId;

                logger.warn({
                    userId: decoded.userId,
                    username: decoded.username,
                    role: decoded.role,
                    tokenSource: token ? 'auth/query' : 'cookie',
                    socketId: socket.id
                }, 'SOCKET AUTH: Socket authenticated via JWT token');
            } catch (err) {
                logger.warn({
                    err: err instanceof Error ? err.message : err,
                    token: actualToken!.substring(0, 20) + '...',
                    tokenSource: token ? 'auth/query' : 'cookie',
                    socketId: socket.id
                }, 'SOCKET AUTH: Invalid token in socket connection');
                // Continue with userId-based auth if available
            }
        }

        // If we have userId (either from token or direct), use it
        if (userId || finalUserId) {
            const effectiveUserId = finalUserId || userId;
            const effectiveUserType = userType || userData.role || 'player';

            userData = {
                ...userData,
                userId: effectiveUserId,
                role: effectiveUserType === 'teacher' ? 'TEACHER' :
                    effectiveUserType === 'student' ? 'STUDENT' :
                        effectiveUserType === 'TEACHER' ? 'TEACHER' :
                            effectiveUserType === 'STUDENT' ? 'STUDENT' : 'STUDENT'
            };
            finalUserId = effectiveUserId;

            logger.warn({
                userId: effectiveUserId,
                userType: effectiveUserType,
                socketId: socket.id,
                userData
            }, 'SOCKET AUTH: Socket authenticated with userId');
        }

        // Set final socket data
        if (finalUserId && userData) {
            socket.data.user = userData;
            socket.data.userId = finalUserId;

            logger.warn('SOCKET AUTH: Final socket data set', {
                socketId: socket.id,
                finalUserId,
                setUserId: socket.data.userId,
                setUserData: socket.data.user
            });
        } else {
            logger.warn({ socketId: socket.id }, 'SOCKET AUTH: Anonymous socket connection');
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
