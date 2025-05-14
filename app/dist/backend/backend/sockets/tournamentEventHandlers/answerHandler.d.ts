/**
 * answerHandler.ts - Tournament Answer Handler
 *
 * This module handles the tournament_answer event, which is emitted when a participant
 * submits an answer to a tournament question.
 */
import { Server, Socket } from 'socket.io';
import { TournamentAnswerPayload } from '../types/socketTypes';
/**
 * Handle tournament_answer event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The answer payload from the client
 */
declare function handleTournamentAnswer(io: Server, socket: Socket, { code, questionUid, answerIdx, clientTimestamp, isDeferred }: TournamentAnswerPayload): void;
export default handleTournamentAnswer;
