/**
 * startHandler.ts - Tournament Start Handler
 *
 * This module handles the start_tournament event, which initializes and starts a tournament.
 */
import { Server, Socket } from 'socket.io';
import { StartTournamentPayload } from '../types/socketTypes';
/**
 * Handle start_tournament event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The start tournament payload from the client
 */
declare function handleStartTournament(io: Server, socket: Socket, { code }: StartTournamentPayload): Promise<void>;
export default handleStartTournament;
