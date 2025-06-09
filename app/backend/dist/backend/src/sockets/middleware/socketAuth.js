"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a middleware-specific logger
const logger = (0, logger_1.default)('SocketAuth');
// JWT secret key should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'mathquest_default_secret';
/**
 * Socket.IO authentication middleware
 * This middleware authenticates teachers and identifies players
 * @param socket The Socket.IO socket
 * @param next Callback to proceed to the next middleware
 */
const socketAuthMiddleware = (socket, next) => {
    try {
        logger.debug({
            socketId: socket.id,
            auth: socket.handshake.auth,
            query: socket.handshake.query,
            headers: socket.handshake.headers
        }, 'Socket authentication middleware called');
        // Accept userId and role from both auth and query for compatibility
        const userId = socket.handshake.auth.userId || socket.handshake.query.userId;
        const userType = socket.handshake.auth.userType || socket.handshake.query.userType;
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        // Also check for JWT token in cookies (for web browser connections)
        let cookieToken = null;
        if (socket.handshake.headers.cookie) {
            const cookies = socket.handshake.headers.cookie;
            const teacherTokenMatch = cookies.match(/teacherToken=([^;]+)/);
            const authTokenMatch = cookies.match(/authToken=([^;]+)/);
            cookieToken = teacherTokenMatch?.[1] || authTokenMatch?.[1] || null;
        }
        // Enhanced debug logging
        logger.debug({
            socketId: socket.id,
            auth: socket.handshake.auth,
            query: socket.handshake.query,
            userId,
            userType,
            hasToken: !!(token || cookieToken),
            tokenPrefix: (token || cookieToken)?.substring(0, 20) + '...' || null,
            hasCookieToken: !!cookieToken,
            cookieTokenPrefix: cookieToken?.substring(0, 20) + '...' || null
        }, 'Socket authentication attempt');
        // Store connection info for debugging
        const connectionInfo = {
            id: socket.id,
            address: socket.handshake.address,
            userAgent: socket.request.headers['user-agent'],
            time: new Date().toISOString()
        };
        // Initialize user data - will be populated based on available auth info
        let userData = {};
        let finalUserId = null;
        // If a token is provided (from auth/query or cookies), try to authenticate as a teacher
        if (token || cookieToken) {
            const actualToken = token || cookieToken;
            try {
                logger.debug({
                    tokenLength: actualToken.length,
                    tokenSource: token ? 'auth/query' : 'cookie',
                    socketId: socket.id
                }, 'Attempting JWT verification');
                const decoded = jwt.verify(actualToken, JWT_SECRET);
                // Use data from JWT token
                userData = {
                    userId: decoded.userId,
                    username: decoded.username,
                    role: decoded.role
                };
                finalUserId = decoded.userId;
                logger.debug({
                    userId: decoded.userId,
                    username: decoded.username,
                    role: decoded.role,
                    tokenSource: token ? 'auth/query' : 'cookie',
                    socketId: socket.id
                }, 'Socket authenticated via JWT token');
            }
            catch (err) {
                logger.warn({
                    err: err instanceof Error ? err.message : err,
                    token: actualToken.substring(0, 20) + '...',
                    tokenSource: token ? 'auth/query' : 'cookie',
                    socketId: socket.id
                }, 'Invalid token in socket connection');
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
            logger.debug({
                userId: effectiveUserId,
                userType: effectiveUserType,
                socketId: socket.id,
                userData
            }, 'Socket authenticated with userId');
        }
        // Set final socket data
        if (finalUserId && userData) {
            socket.data.user = userData;
            socket.data.userId = finalUserId;
            // SIMPLE DEBUG LOG
            console.log('SOCKET AUTH DEBUG:', {
                socketId: socket.id,
                finalUserId,
                setUserId: socket.data.userId,
                setUserData: socket.data.user
            });
            logger.debug({
                socketId: socket.id,
                finalUserId,
                userData,
                socketDataUserId: socket.data.userId,
                socketDataUser: socket.data.user
            }, 'Final socket data set');
        }
        else {
            logger.debug({ socketId: socket.id }, 'Anonymous socket connection');
        }
        // Store connection info in socket data for potential later use
        socket.data.connectionInfo = connectionInfo;
        // Always proceed - authorization is handled at the event level
        next();
    }
    catch (error) {
        logger.error({ error, socketId: socket.id }, 'Error in socket authentication');
        next();
    }
};
exports.socketAuthMiddleware = socketAuthMiddleware;
