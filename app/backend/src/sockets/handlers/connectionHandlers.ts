import { Server as SocketIOServer, Socket } from 'socket.io';
import createLogger from '@/utils/logger';
import { registerLobbyHandlers } from './lobbyHandler';
import gameHandler from './gameHandler';
import teacherControlHandler from './teacherControlHandler';
import { registerTournamentHandlers } from './tournament';
import { disconnectHandler } from './disconnectHandler';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '@shared/types/socketEvents';

// Create a handler-specific logger
const logger = createLogger('ConnectionHandlers');

/**
 * Register connection and disconnection handlers for Socket.IO
 * @param io Socket.IO server instance
 */
export function registerConnectionHandlers(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): void {
    io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
        handleConnection(socket);
        socket.on('disconnect', disconnectHandler(io, socket));

        // Register feature-specific handlers
        registerLobbyHandlers(io, socket);
        gameHandler(io, socket);
        teacherControlHandler(io, socket);
        registerTournamentHandlers(io, socket);
    });
}

/**
 * Handle new socket connection
 * @param socket Connected socket
 */
function handleConnection(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): void {
    const { id } = socket;
    // socket.data is now typed as SocketData
    // Fix: extract user from socket.data.user if present
    const user = (socket.data && (socket.data as any).user) ? (socket.data as any).user : (socket.data || { role: 'anonymous' });

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
    socket.emit('connection_established', {
        socketId: id,
        timestamp: new Date().toISOString(),
        user: userPayload
    });

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
