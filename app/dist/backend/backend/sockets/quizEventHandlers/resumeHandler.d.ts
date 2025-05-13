import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { PauseResumePayload } from '@sockets/types/socketTypes';
declare function handleResume(io: Server, socket: Socket, prisma: PrismaClient, { quizId, teacherId, tournamentCode }: PauseResumePayload): void;
export default handleResume;
