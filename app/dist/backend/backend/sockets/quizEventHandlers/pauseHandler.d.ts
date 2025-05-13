import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { PauseResumePayload } from '../types/socketTypes';
declare function handlePause(io: Server, socket: Socket, prisma: PrismaClient, { quizId, teacherId, tournamentCode }: PauseResumePayload): Promise<void>;
export default handlePause;
