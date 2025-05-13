/**
 * timerActionHandler.ts - Handler for quiz timer actions
 *
 * This handler manages timer state (play/pause/stop) for quiz questions.
 * It updates timers in both quiz and tournament states when applicable.
 *
 * UPDATED: Now uses per-question timer tracking to maintain individual
 * timer states for each question.
 */
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { TimerActionPayload } from '@sockets/types/socketTypes';
/**
 * Handle quiz_timer_action event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client
 * @param payload - Event payload with timer action details
 */
declare function handleTimerAction(io: Server, socket: Socket, prisma: PrismaClient, { status, questionId, timeLeft, quizId, tournamentCode }: TimerActionPayload): Promise<void>;
export default handleTimerAction;
