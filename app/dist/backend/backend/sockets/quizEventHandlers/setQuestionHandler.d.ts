/**
 * setQuestionHandler.ts - Handler for setting the active question in a quiz
 *
 * Updates the quiz state with the new question index and timer settings.
 * If linked to a tournament, it triggers the corresponding question update
 * and starts the timer in the tournament state using trigger functions.
 *
 * UPDATED: Now uses per-question timer tracking to maintain individual
 * timer states for each question.
 */
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { SetQuestionPayload } from '../types/socketTypes';
/**
 * Handle quiz_set_question event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client
 * @param payload - Event payload containing quizId, questionUid, etc.
 */
declare function handleSetQuestion(io: Server, socket: Socket, prisma: PrismaClient, { quizId, questionUid, questionIdx, tournamentCode, teacherId }: SetQuestionPayload): Promise<void>;
export default handleSetQuestion;
