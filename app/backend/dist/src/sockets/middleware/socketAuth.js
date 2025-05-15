"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        const playerId = socket.handshake.auth.playerId;
        // Store connection info for debugging
        const connectionInfo = {
            id: socket.id,
            address: socket.handshake.address,
            userAgent: socket.request.headers['user-agent'],
            time: new Date().toISOString()
        };
        // If a token is provided, try to authenticate as a teacher
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                // Attach the teacher data to the socket
                socket.data.user = {
                    teacherId: decoded.teacherId,
                    username: decoded.username,
                    role: 'teacher'
                };
                logger.debug({ teacherId: decoded.teacherId, socketId: socket.id }, 'Teacher socket authenticated');
            }
            catch (err) {
                logger.warn({ err, socketId: socket.id }, 'Invalid token in socket connection');
                // Don't reject the connection, just don't attach teacher data
            }
        }
        // If a player ID is provided, store it with the socket
        if (playerId) {
            socket.data.user = {
                ...socket.data.user,
                playerId,
                role: socket.data.user?.role || 'player'
            };
            logger.debug({ playerId, socketId: socket.id }, 'Player socket identified');
        }
        // If neither token nor playerId is provided
        if (!token && !playerId) {
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
