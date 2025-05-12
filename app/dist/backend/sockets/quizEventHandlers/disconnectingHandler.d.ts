/**
 * disconnectingHandler.ts - Handler for socket disconnection from quiz
 *
 * This handler manages cleanup when a socket disconnects from a quiz.
 * It removes the socket from connected sockets, updates counts, and
 * handles teacher disconnections.
 */
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
/**
 * Handle disconnecting event for quiz sockets
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection that is disconnecting
 * @param prisma - Prisma client for database operations
 */
declare function handleDisconnecting(io: Server, socket: Socket, prisma: PrismaClient): Promise<void>;
export default handleDisconnecting;
