/**
 * tournamentEvents.ts - Register tournament-related socket.io event handlers
 *
 * This file centralizes all tournament-related socket event handling by importing
 * handler functions from individual files and registering them with socket.io.
 * Each handler is in its own file for modularity and maintainability.
 */
import { Server, Socket } from 'socket.io';
/**
 * Register all tournament-related socket event handlers
 *
 * @param io - Socket.IO server instance
 * @param socket - Individual socket connection
 */
declare function registerTournamentEvents(io: Server, socket: Socket): void;
declare namespace registerTournamentEvents {
    var displayName: string;
}
export { registerTournamentEvents };
