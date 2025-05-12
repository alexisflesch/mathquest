/**
 * joinQuizHandler.ts - Handler for joining a quiz
 *
 * This handler manages the process of a user joining a quiz session.
 * It initializes the quiz state if needed, loads questions, and handles
 * teacher/student/projector connections.
 */
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { JoinQuizPayload } from '../types/socketTypes';
/**
 * Handler for join_quiz event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma client for database operations
 * @param payload - Join quiz payload containing quizId, role and optional teacherId
 */
declare function handleJoinQuiz(io: Server, socket: Socket, prisma: PrismaClient, { quizId, role, teacherId }: JoinQuizPayload): Promise<void>;
export default handleJoinQuiz;
