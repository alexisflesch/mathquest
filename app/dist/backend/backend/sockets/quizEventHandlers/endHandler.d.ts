/**
 * endHandler.ts - Handler for ending a quiz
 *
 * This handler manages quiz end operations, including ending any linked tournament.
 * Only the teacher who owns the quiz can end it.
 */
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { EndQuizPayload } from '@sockets/types/socketTypes';
/**
 * Handle quiz_end event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client (not used but included for consistent handler signature)
 * @param payload - Event payload containing quizId, teacherId, tournamentCode
 */
declare function handleEnd(io: Server, socket: Socket, prisma: PrismaClient, { quizId, teacherId, tournamentCode, forceEnd }: EndQuizPayload): void;
export default handleEnd;
