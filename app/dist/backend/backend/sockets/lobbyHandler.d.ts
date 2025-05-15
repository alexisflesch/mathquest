/**
 * lobbyHandler.ts - Lobby Management Socket Handler
 *
 * This module handles the real-time functionality of tournament lobbies, where
 * participants gather before a tournament starts. Key responsibilities include:
 *
 * - Tracking participants joining and leaving lobbies
 * - Broadcasting participant lists to all connected clients
 * - Managing socket room memberships for proper event routing
 * - Maintaining in-memory state of lobby participants
 *
 * Each tournament has its own lobby, identified by the tournament code.
 * When a tournament starts, participants are automatically moved from
 * the lobby to the active tournament.
 */
import { Server, Socket } from 'socket.io';
interface LobbyParticipant {
    id: string;
    username: string;
    avatar: string;
    cookie_id?: string;
}
declare const lobbyParticipants: Record<string, LobbyParticipant[]>;
/**
 * Register all lobby-related socket event handlers
 * @param io - Socket.IO server instance
 * @param socket - Socket connection
 */
declare function registerLobbyHandlers(io: Server, socket: Socket): void;
export { registerLobbyHandlers, lobbyParticipants, };
export type { LobbyParticipant };
