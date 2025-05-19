"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerConnectionHandlers = registerConnectionHandlers;
const logger_1 = __importDefault(require("@/utils/logger"));
const lobbyHandler_1 = require("./lobbyHandler");
const gameHandler_1 = __importDefault(require("./gameHandler"));
const teacherControlHandler_1 = __importDefault(require("./teacherControlHandler"));
// Create a handler-specific logger
const logger = (0, logger_1.default)('ConnectionHandlers');
/**
 * Register connection and disconnection handlers for Socket.IO
 * @param io Socket.IO server instance
 */
function registerConnectionHandlers(io) {
    io.on('connection', (socket) => {
        handleConnection(socket);
        handleDisconnection(socket);
        // Register feature-specific handlers
        (0, lobbyHandler_1.registerLobbyHandlers)(io, socket);
        (0, gameHandler_1.default)(io, socket);
        (0, teacherControlHandler_1.default)(io, socket);
    });
}
/**
 * Handle new socket connection
 * @param socket Connected socket
 */
function handleConnection(socket) {
    const { id } = socket;
    const user = socket.data.user || { role: 'anonymous' };
    logger.info({
        socketId: id,
        user,
        address: socket.handshake.address
    }, 'New socket connection established');
    // Emit welcome event to the client
    socket.emit('connection_established', {
        socketId: id,
        timestamp: new Date().toISOString(),
        user: {
            role: user.role,
            ...(user.playerId ? { playerId: user.playerId } : {}),
            ...(user.teacherId ? { isTeacher: true } : {})
        }
    });
    // Register any other connection-specific event handlers here
}
/**
 * Handle socket disconnection
 * @param socket Connected socket
 */
function handleDisconnection(socket) {
    socket.on('disconnect', (reason) => {
        const { id } = socket;
        const user = socket.data.user || { role: 'anonymous' };
        logger.info({
            socketId: id,
            user,
            reason
        }, 'Socket disconnected');
        // Clean up any resources if needed
        // For example, remove the socket from game rooms
    });
}
