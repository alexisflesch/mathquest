import { Server as SocketIOServer, Socket } from 'socket.io';
import createLogger from '@/utils/logger';
import { registerLobbyHandlers } from './lobbyHandler';
import gameHandler from './gameHandler';
import teacherControlHandler from './teacherControlHandler';
import { registerTournamentHandlers } from './tournament';
import { registerPracticeSessionHandlers, handlePracticeSessionDisconnect } from './practiceSessionHandler';
import { projectionHandler } from './projectionHandler';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '@shared/types/socketEvents';
import { socketDataSchema, connectionEstablishedPayloadSchema } from '@shared/types/socketEvents.zod';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { z } from 'zod';
// Import disconnect handlers at module level to avoid async import issues during Jest teardown
import { disconnectHandler as gameDisconnectHandler } from './game/disconnect';
import { disconnectHandler as teacherDisconnectHandler } from './teacherControl/disconnect';
import { disconnectHandler as mainDisconnectHandler } from './disconnectHandler';

// Derive types from Zod schemas
type ConnectionEstablishedPayload = z.infer<typeof connectionEstablishedPayloadSchema>;

// Create a handler-specific logger
const logger = createLogger('ConnectionHandlers');

/**
 * Register connection and disconnection handlers for Socket.IO
 * @param io Socket.IO server instance
 */
export function registerConnectionHandlers(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): void {
    io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
        logger.info('[SOCKET DEBUG] New socket connection:', socket.id);
        console.log('[SOCKET DEBUG] New socket connection:', socket.id, {
            handshake: socket.handshake,
            headers: socket.handshake.headers,
            auth: socket.handshake.auth,
            query: socket.handshake.query
        });

        // TOP-LEVEL: Log all events received by any socket (gated by env flag)
        // WARNING: This can be very verbose in production, use SOCKET_DEBUG_EVENTS=true only for debugging
        if (process.env.SOCKET_DEBUG_EVENTS === 'true') {
            socket.onAny((event, ...args) => {
                logger.info(`[SOCKET DEBUG] onAny: ${event} socket: ${socket.id}`, { args });
            });
        } else {
            logger.debug('socket.onAny logging disabled (set SOCKET_DEBUG_EVENTS=true to enable)');
        }

        handleConnection(socket);

        // Create custom disconnect handler that includes all cleanup
        socket.on('disconnect', async (reason) => {
            logger.info({ socketId: socket.id, reason }, 'Socket disconnecting - starting cleanup');

            // Handle practice session cleanup first
            handlePracticeSessionDisconnect(io, socket);

            // Handle game-specific disconnect logic
            await gameDisconnectHandler(io, socket)();

            // Handle teacher dashboard disconnect logic
            await teacherDisconnectHandler(io, socket)();

            // Handle main disconnect logic (for general participant tracking)
            await mainDisconnectHandler(io, socket)(reason);

            logger.info({ socketId: socket.id, reason }, 'Socket disconnect cleanup completed');
        });

        // Register feature-specific handlers
        registerLobbyHandlers(io, socket);
        gameHandler(io, socket);
        teacherControlHandler(io, socket);
        registerTournamentHandlers(io, socket);
        registerPracticeSessionHandlers(io, socket);
        projectionHandler(io, socket); // Register modern projection handler
    });
}

/**
 * Handle new socket connection
 * @param socket Connected socket
 */
function handleConnection(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): void {
    const { id } = socket;

    // Validate socket data structure using Zod schema
    let user: any;
    try {
        // socket.data is now typed as SocketData
        const rawUser = (socket.data && (socket.data as any).user) ? (socket.data as any).user : (socket.data || { role: 'GUEST' });

        // Validate the user data against our schema
        const validationResult = socketDataSchema.partial().safeParse(rawUser);
        if (!validationResult.success) {
            logger.warn({
                socketId: id,
                validationErrors: validationResult.error.errors,
                rawUserData: rawUser
            }, 'Socket connection data validation failed, using defaults');
            user = { role: 'GUEST' };
        } else {
            user = validationResult.data;
        }
    } catch (error) {
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
    let userPayload: Partial<SocketData> = {};
    // Map legacy/invalid roles to canonical roles
    function toCanonicalRole(role: any): 'STUDENT' | 'TEACHER' | 'GUEST' {
        if (role === 'TEACHER' || role === 'teacher') return 'TEACHER';
        if (role === 'STUDENT' || role === 'player' || role === 'student') return 'STUDENT';
        if (role === 'GUEST' || role === 'guest' || role === 'anonymous') return 'GUEST';
        return 'GUEST';
    }
    userPayload = {
        role: toCanonicalRole(user.role),
        userId: user.id || user.userId, // always use userId for all roles
        username: user.username
    } as Partial<SocketData>;
    // Remove undefined keys for clean payload
    Object.keys(userPayload).forEach(key => userPayload[key as keyof typeof userPayload] === undefined && delete userPayload[key as keyof typeof userPayload]);

    // Emit welcome event to the client - this will be type-checked
    const payload: ConnectionEstablishedPayload = {
        socketId: id,
        timestamp: new Date().toISOString(),
        user: userPayload
    };

    try {
        connectionEstablishedPayloadSchema.parse(payload);
        socket.emit(SOCKET_EVENTS.CONNECTION_ESTABLISHED as any, payload);
    } catch (error) {
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
