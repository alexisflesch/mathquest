/**
 * lockHandler.ts - Handler for locking a quiz
 *
 * This locks a quiz to prevent further answers from students.
 * Only the teacher who owns the quiz can lock it.
 */
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { LockUnlockPayload } from '../types/socketTypes';
/**
 * Handle quiz_lock event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client (not used but included for consistent handler signature)
 * @param payload - Event payload containing quizId
 */
declare function handleLock(io: Server, socket: Socket, prisma: PrismaClient, { quizId, teacherId }: LockUnlockPayload): void;
export default handleLock;
