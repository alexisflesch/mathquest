import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, ErrorPayload } from '@shared/types/socketEvents';
import type { GameEndedPayload } from '@shared/types/socket/payloads';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { QUESTION_TYPES } from '@shared/constants/questionTypes';
import { requestNextQuestionPayloadSchema } from '@shared/types/socketEvents.zod';
import type { LiveQuestionPayload } from '@shared/types/quiz/liveQuestion';
import { TimingService } from '@/services/timingService';
import { emitQuestionHandler } from './emitQuestionHandler';

const logger = createLogger('RequestNextQuestionHandler');

export function requestNextQuestionHandler(
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) {
    // Use the canonical emitQuestionHandler for all question emission
    const emitQuestion = emitQuestionHandler(io, socket);
    return async (payload: any) => {
        logger.info({ payload }, '[DEBUG] requestNextQuestionHandler called');
        // Runtime validation with Zod
        const parseResult = requestNextQuestionPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid requestNextQuestion payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');

            const errorPayload: ErrorPayload = {
                message: 'Invalid requestNextQuestion payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };

            socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
            return;
        }

        const validPayload = parseResult.data;
        const { accessCode, userId, currentQuestionUid } = validPayload;
        logger.info({ accessCode, userId, currentQuestionUid }, '[DEBUG] requestNextQuestionHandler params');

        try {
            logger.info({ socketId: socket.id, event: 'request_next_question', accessCode, userId, currentQuestionUid }, 'Player requested next question');

            // 1. Get game instance
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { accessCode },
                select: {
                    id: true,
                    playMode: true,
                    isDiffered: true,
                    gameTemplateId: true
                }
            });

            if (!gameInstance) {
                const errorPayload: ErrorPayload = { message: 'Game not found.' };
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
                return;
            }

            // Allow request_next_question for practice mode
            if (gameInstance.playMode !== 'practice') {
                logger.warn({ accessCode, userId }, 'Request next question is only for practice mode.');
                const errorPayload: ErrorPayload = { message: 'This operation is only for practice mode.' };
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
                return;
            }

            // 2. Get participant
            const participant = await prisma.gameParticipant.findFirst({
                where: { gameInstanceId: gameInstance.id, userId }
            });

            if (!participant) {
                const errorPayload: ErrorPayload = { message: 'Participant not found.' };
                socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
                return;
            }

            // 3. Get all questions
            const allQuestions = await prisma.questionsInGameTemplate.findMany({
                where: { gameTemplateId: gameInstance.gameTemplateId },
                orderBy: { sequence: 'asc' },
                include: { question: true }
            });

            // Find the next question after the current one
            let nextQuestionUid = undefined;
            if (currentQuestionUid) {
                const currentIndex = allQuestions.findIndex(q => q.questionUid === currentQuestionUid);
                if (currentIndex !== -1 && currentIndex < allQuestions.length - 1) {
                    nextQuestionUid = allQuestions[currentIndex + 1].questionUid;
                }
            } else if (allQuestions.length > 0) {
                nextQuestionUid = allQuestions[0].questionUid;
            }

            if (nextQuestionUid) {
                // Use canonical handler for emission and timing
                await emitQuestion({ accessCode, userId, questionUid: nextQuestionUid });
            } else {
                // All questions answered: compute and send final score
                const total = allQuestions.length;
                // TODO: Use canonical scoring/answer tracking if available
                // For now, just send GAME_ENDED event
                logger.info({ accessCode, userId, total }, 'Practice mode completed, sending final score');
                const gameEndedPayload: GameEndedPayload = {
                    accessCode,
                    score: total, // Placeholder: should be correct count
                    totalQuestions: total,
                    correct: total,
                    total: total
                };
                socket.emit(SOCKET_EVENTS.GAME.GAME_ENDED as any, gameEndedPayload);
                logger.info({ participantId: participant.id }, 'Practice completed (no database update needed)');
            }
        } catch (err) {
            logger.error({ err, socketId: socket.id }, 'Error handling request_next_question');
            const errorPayload: ErrorPayload = { message: 'Error processing next question request.' };
            socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
        }
    };
}
