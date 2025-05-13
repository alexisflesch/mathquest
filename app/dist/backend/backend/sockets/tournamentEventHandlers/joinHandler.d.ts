/**
 * joinHandler.ts - Tournament Join Handler (Stub)
 *
 * This is a temporary stub implementation that will be completed later.
 */
import { Server, Socket } from 'socket.io';
import { JoinTournamentPayload } from '../types/socketTypes';
/**
 * Handle join_tournament event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The join payload from the client
 */
declare function handleJoinTournament(io: Server, socket: Socket, payload: JoinTournamentPayload): Promise<void>;
export default handleJoinTournament;
