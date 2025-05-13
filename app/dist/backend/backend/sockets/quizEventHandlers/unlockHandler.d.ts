/**
 * unlockHandler.ts - Handler for unlocking a quiz
 *
 * This unlocks a quiz to allow answers from students.
 * Only the teacher who owns the quiz can unlock it.
 */
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { LockUnlockPayload } from '@sockets/types/socketTypes';
/**
 * Handle quiz_unlock event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client (not used but included for consistent handler signature)
 * @param payload - Event payload containing quizId
 */
declare function handleUnlock(io: Server, socket: Socket, prisma: PrismaClient, { quizId, teacherId }: LockUnlockPayload): void;
export default handleUnlock;
