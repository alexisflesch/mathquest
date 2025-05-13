/**
 * disconnectingHandler.ts - Tournament Disconnecting Handler
 *
 * This module handles the disconnecting event for tournament participants.
 */
import { Server, Socket } from 'socket.io';
/**
 * Handle disconnecting event for tournament participants
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 */
declare function handleDisconnecting(io: Server, socket: Socket): Promise<void>;
export default handleDisconnecting;
