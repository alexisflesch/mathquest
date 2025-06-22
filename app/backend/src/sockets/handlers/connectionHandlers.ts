import { Server as SocketIOServer, Socket } from 'socket.io';
import createLogger from '@/utils/logger';
import { registerLobbyHandlers } from './lobbyHandler';
import gameHandler from './gameHandler';
import teacherControlHandler from './teacherControlHandler';
import { registerTournamentHandlers } from './tournament';
import { disconnectHandler } from './disconnectHandler';
import { registerPracticeSessionHandlers, handlePracticeSessionDisconnect } from './practiceSessionHandler';
import { projectionHandler } from './projectionHandler';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '@shared/types/socketEvents';
import { socketDataSchema, connectionEstablishedPayloadSchema } from '@shared/types/socketEvents.zod';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { z } from 'zod';

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

        // TOP-LEVEL: Log all events received by any socket for deep debugging
        socket.onAny((event, ...args) => {
            logger.info('[SOCKET DEBUG] onAny:', event, args, 'socket:', socket.id);
        });

        handleConnection(socket);

        // Create custom disconnect handler that includes practice session cleanup
        socket.on('disconnect', (reason) => {
            // Handle practice session cleanup first
            handlePracticeSessionDisconnect(io, socket);
            // Then handle normal disconnect
            disconnectHandler(io, socket)(reason);
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
        const rawUser = (socket.data && (socket.data as any).user) ? (socket.data as any).user : (socket.data || { role: 'anonymous' });

        // Validate the user data against our schema
        const validationResult = socketDataSchema.partial().safeParse(rawUser);
        if (!validationResult.success) {
            logger.warn({
                socketId: id,
                validationErrors: validationResult.error.errors,
                rawUserData: rawUser
            }, 'Socket connection data validation failed, using defaults');
            user = { role: 'anonymous' };
        } else {
            user = validationResult.data;
        }
    } catch (error) {
        logger.error({
            socketId: id,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 'Error validating socket connection data');
        user = { role: 'anonymous' };
    }

    logger.info({
        socketId: id,
        user,
        address: socket.handshake.address
    }, 'New socket connection established');

    // Build user object for event, using userId for all roles (players, teachers, admins)
    let userPayload: Partial<SocketData> = {};
    userPayload = {
        role: user.role,
        userId: user.id || user.userId, // always use userId for all roles
        username: user.username
    };
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
