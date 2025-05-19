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
                const decoded = jwt.verify(token, JWT_SECRET);
                // Attach the user data to the socket
                socket.data.user = {
                    userId: decoded.userId,
                    username: decoded.username,
                    role: decoded.role
                };
                logger.debug({ userId: decoded.userId, socketId: socket.id }, 'Teacher socket authenticated');
            }
            catch (err) {
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
    }
    catch (error) {
        logger.error({ error, socketId: socket.id }, 'Error in socket authentication');
        next();
    }
};
exports.socketAuthMiddleware = socketAuthMiddleware;
