/**
 * quizEvents.ts - Quiz Socket Event Registration
 *
 * This module imports individual event handlers for quiz-related actions
 * and registers them with the Socket.IO socket instance.
 */
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { QuizState } from './types/quizTypes';
/**
 * Initialize quiz state if it doesn't already exist
 * @param quizId - Quiz ID
 * @param prisma - Prisma client
 * @param socket - Socket connection
 * @param role - User role ('teacher', 'projector', etc.)
 * @param teacherId - Teacher ID if role is 'teacher'
 */
declare function ensureQuizStateInitialized(quizId: string, prisma: PrismaClient, socket: Socket, role?: string | null, teacherId?: string | null): Promise<QuizState>;
/**
 * Register all quiz-related event handlers for a socket
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client
 */
declare function registerQuizEvents(io: Server, socket: Socket, prisma: PrismaClient): void;
export { ensureQuizStateInitialized, registerQuizEvents };
