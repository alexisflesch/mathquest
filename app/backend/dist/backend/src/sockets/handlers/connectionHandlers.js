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
const tournament_1 = require("./tournament");
const disconnectHandler_1 = require("./disconnectHandler");
const practiceSessionHandler_1 = require("./practiceSessionHandler");
const projectionHandler_1 = require("./projectionHandler");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const events_1 = require("@shared/types/socket/events");
// Create a handler-specific logger
const logger = (0, logger_1.default)('ConnectionHandlers');
/**
 * Register connection and disconnection handlers for Socket.IO
 * @param io Socket.IO server instance
 */
function registerConnectionHandlers(io) {
    io.on('connection', (socket) => {
        logger.info('[SOCKET DEBUG] New socket connection:', socket.id);
        // TOP-LEVEL: Log all events received by any socket for deep debugging
        socket.onAny((event, ...args) => {
            logger.info('[SOCKET DEBUG] onAny:', event, args, 'socket:', socket.id);
        });
        handleConnection(socket);
        // Create custom disconnect handler that includes practice session cleanup
        socket.on('disconnect', (reason) => {
            // Handle practice session cleanup first
            (0, practiceSessionHandler_1.handlePracticeSessionDisconnect)(io, socket);
            // Then handle normal disconnect
            (0, disconnectHandler_1.disconnectHandler)(io, socket)(reason);
        });
        // Register feature-specific handlers
        (0, lobbyHandler_1.registerLobbyHandlers)(io, socket);
        (0, gameHandler_1.default)(io, socket);
        (0, teacherControlHandler_1.default)(io, socket);
        (0, tournament_1.registerTournamentHandlers)(io, socket);
        (0, practiceSessionHandler_1.registerPracticeSessionHandlers)(io, socket);
        (0, projectionHandler_1.projectionHandler)(io, socket); // Register modern projection handler
    });
}
/**
 * Handle new socket connection
 * @param socket Connected socket
 */
function handleConnection(socket) {
    const { id } = socket;
    // Validate socket data structure using Zod schema
    let user;
    try {
        // socket.data is now typed as SocketData
        const rawUser = (socket.data && socket.data.user) ? socket.data.user : (socket.data || { role: 'GUEST' });
        // Validate the user data against our schema
        const validationResult = socketEvents_zod_1.socketDataSchema.partial().safeParse(rawUser);
        if (!validationResult.success) {
            logger.warn({
                socketId: id,
                validationErrors: validationResult.error.errors,
                rawUserData: rawUser
            }, 'Socket connection data validation failed, using defaults');
            user = { role: 'GUEST' };
        }
        else {
            user = validationResult.data;
        }
    }
    catch (error) {
        logger.error({
            socketId: id,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 'Error validating socket connection data');
        user = { role: 'GUEST' };
    }
    logger.info({
        socketId: id,
        user,
        address: socket.handshake.address
    }, 'New socket connection established');
    // Build user object for event, using userId for all roles (players, teachers, admins)
    let userPayload = {};
    // Map legacy/invalid roles to canonical roles
    function toCanonicalRole(role) {
        if (role === 'TEACHER' || role === 'teacher')
            return 'TEACHER';
        if (role === 'STUDENT' || role === 'player' || role === 'student')
            return 'STUDENT';
        if (role === 'GUEST' || role === 'guest' || role === 'anonymous')
            return 'GUEST';
        return 'GUEST';
    }
    userPayload = {
        role: toCanonicalRole(user.role),
        userId: user.id || user.userId, // always use userId for all roles
        username: user.username
    };
    // Remove undefined keys for clean payload
    Object.keys(userPayload).forEach(key => userPayload[key] === undefined && delete userPayload[key]);
    // Emit welcome event to the client - this will be type-checked
    const payload = {
        socketId: id,
        timestamp: new Date().toISOString(),
        user: userPayload
    };
    try {
        socketEvents_zod_1.connectionEstablishedPayloadSchema.parse(payload);
        socket.emit(events_1.SOCKET_EVENTS.CONNECTION_ESTABLISHED, payload);
    }
    catch (error) {
        logger.error('Invalid connection_established payload:', error);
    }
    // Register any other connection-specific event handlers here
}
/**
 * Handle socket disconnection
 * @param socket Connected socket
 */
// function handleDisconnection(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): void {
//     socket.on('disconnect', (reason) => {
//         const user = socket.data || { role: 'anonymous' };
//         logger.info({
//             socketId: socket.id,
//             user,
//             reason
//         }, 'Socket disconnected (old handler - should be removed after new one is confirmed working)');
//         // Example: If the socket was in a game, notify other players
//         // This specific logic is now part of the new disconnectHandler.ts
//         // if (socket.data.accessCode && socket.data.userId) {
//         //     socket.to(socket.data.accessCode).emit('player_left_game', {
//         //         userId: socket.data.userId,
//         //         socketId: socket.id
//         //     });
//         // }
//         // Add any other cleanup logic needed on disconnection
//     });
// }
