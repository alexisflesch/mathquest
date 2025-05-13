/**
 * resumeHandler.ts - Tournament Resume Handler
 *
 * This module handles the tournament_resume event, resuming a paused tournament question.
 */
import { Server, Socket } from 'socket.io';
import { ResumeTournamentPayload } from '../types/socketTypes';
/**
 * Handle tournament_resume event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The resume payload from the client
 */
declare function handleTournamentResume(io: Server, socket: Socket, { code }: ResumeTournamentPayload): void;
export default handleTournamentResume;
