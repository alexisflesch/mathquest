import { Server as SocketIOServer, Socket } from 'socket.io';
import { joinGameHandler } from './joinGame';
import { gameAnswerHandler } from './gameAnswer';
import { requestParticipantsHandler } from './requestParticipants';
import { disconnectHandler } from './disconnect';
import { requestNextQuestionHandler } from './requestNextQuestion';
import { GAME_EVENTS } from '@shared/types/socket/events';
import createLogger from '@/utils/logger';

const logger = createLogger('GameHandlers');

export function registerGameHandlers(io: SocketIOServer, socket: Socket) {
    logger.info({ socketId: socket.id }, 'Registering game handlers');

    // Register direct handlers on socket instance using shared constants
    socket.on(GAME_EVENTS.JOIN_GAME, joinGameHandler(io, socket));
    socket.on(GAME_EVENTS.GAME_ANSWER, gameAnswerHandler(io, socket));
    socket.on(GAME_EVENTS.REQUEST_PARTICIPANTS, requestParticipantsHandler(io, socket));
    socket.on(GAME_EVENTS.REQUEST_NEXT_QUESTION, requestNextQuestionHandler(io, socket));
    socket.on('disconnect', disconnectHandler(io, socket));

    // Direct handler for start_game in practice mode
    socket.on(GAME_EVENTS.START_GAME, async (payload) => {
        logger.info({ socketId: socket.id, payload }, 'Start game event received');

        try {
            const { accessCode, userId } = payload;

            const prismaInstance = (await import('@/db/prisma')).prisma;
            const gameInstance = await prismaInstance.gameInstance.findUnique({
                where: { accessCode },
                include: {
                    gameTemplate: {
                        include: {
                            questions: {
                                include: { question: true },
                                orderBy: { sequence: 'asc' }
                            }
                        }
                    }
                }
            });

            if (!gameInstance || !gameInstance.gameTemplate) {
                logger.warn({ socketId: socket.id, accessCode }, 'Game instance or template not found');
                socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Game not found or template missing.' });
                return;
            }

            if (gameInstance.playMode !== 'practice') {
                logger.warn({ socketId: socket.id, playMode: gameInstance.playMode }, 'start_game is only for practice mode');
                socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'start_game only allowed in practice mode.' });
                return;
            }

            // Update game status
            await prismaInstance.gameInstance.update({
                where: { id: gameInstance.id },
                data: { status: 'active', startedAt: new Date() }
            });

            // Check if we have questions
            if (gameInstance.gameTemplate.questions.length === 0) {
                logger.warn({ socketId: socket.id, accessCode }, 'No questions in template');
                socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'No questions available in this game.' });
                return;
            }

            // Get first question
            const firstQuestionInTemplate = gameInstance.gameTemplate.questions[0];
            const firstQuestion = firstQuestionInTemplate.question;

            // Send first question
            logger.info({ socketId: socket.id, questionUid: firstQuestion.uid }, 'Sending first question');

            // ⚠️ SECURITY: Filter question to remove sensitive data (correctAnswers, explanation, etc.)
            const { filterQuestionForClient } = await import('@/../../shared/types/quiz/liveQuestion');
            const filteredQuestion = filterQuestionForClient(firstQuestion);

            // Send first question data using filtered question
            socket.emit(GAME_EVENTS.GAME_QUESTION, {
                question: filteredQuestion,
                timer: firstQuestion.timeLimit || 30,
                questionIndex: 0,
                totalQuestions: gameInstance.gameTemplate.questions.length,
                questionState: 'active' as const
            });

        } catch (err) {
            logger.error({ socketId: socket.id, error: err }, 'Error in start_game handler');
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Failed to start game: ' + (err as Error).message });
        }
    });
}

export { registerTournamentHandlers } from '../tournament/index';
