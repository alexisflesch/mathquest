/**
 * pauseHandler.ts - Tournament Pause Handler
 *
 * This module handles the tournament_pause event, pausing the current tournament question.
 */
import { Server, Socket } from 'socket.io';
import { PauseTournamentPayload } from '../types/socketTypes';
/**
 * Handle tournament_pause event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The pause payload from the client
 */
declare function handleTournamentPause(io: Server, socket: Socket, { code }: PauseTournamentPayload): void;
export default handleTournamentPause;
