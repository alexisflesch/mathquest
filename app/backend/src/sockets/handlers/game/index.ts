import { Server as SocketIOServer, Socket } from 'socket.io';
import { joinGameHandler } from './joinGame';
import { gameAnswerHandler } from './gameAnswer';
import { requestParticipantsHandler } from './requestParticipants';
import { disconnectHandler } from './disconnect';
import { requestNextQuestionHandler } from './requestNextQuestion';
import createLogger from '@/utils/logger';

const logger = createLogger('GameHandlers');

export function registerGameHandlers(io: SocketIOServer, socket: Socket) {
    logger.info({ socketId: socket.id }, 'Registering game handlers');

    // Register direct handlers on socket instance
    socket.on('join_game', joinGameHandler(io, socket));
    socket.on('game_answer', gameAnswerHandler(io, socket));
    socket.on('request_participants', requestParticipantsHandler(io, socket));
    socket.on('request_next_question', requestNextQuestionHandler(io, socket));
    socket.on('disconnect', disconnectHandler(io, socket));

    // Direct handler for start_game in practice mode
    socket.on('start_game', async (payload) => {
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
                socket.emit('game_error', { message: 'Game not found or template missing.' });
                return;
            }

            if (gameInstance.playMode !== 'practice') {
                logger.warn({ socketId: socket.id, playMode: gameInstance.playMode }, 'start_game is only for practice mode');
                socket.emit('game_error', { message: 'start_game only allowed in practice mode.' });
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
                socket.emit('game_error', { message: 'No questions available in this game.' });
                return;
            }

            // Get first question
            const firstQuestionInTemplate = gameInstance.gameTemplate.questions[0];
            const firstQuestion = firstQuestionInTemplate.question;

            // Send first question
            logger.info({ socketId: socket.id, questionId: firstQuestion.uid }, 'Sending first question');
            // Send first question data directly as per QuestionData type
            socket.emit('game_question', {
                uid: firstQuestion.uid,
                text: firstQuestion.text,
                answerOptions: firstQuestion.answerOptions,
                correctAnswers: firstQuestion.correctAnswers,
                timeLimit: firstQuestion.timeLimit,
                questionType: firstQuestion.questionType,
                themes: firstQuestion.themes,
                difficulty: firstQuestion.difficulty,
                discipline: firstQuestion.discipline,
                title: firstQuestion.title || undefined,
                currentQuestionIndex: 0,
                totalQuestions: gameInstance.gameTemplate.questions.length
            });

        } catch (err) {
            logger.error({ socketId: socket.id, error: err }, 'Error in start_game handler');
            socket.emit('game_error', { message: 'Failed to start game: ' + (err as Error).message });
        }
    });
}

export { registerTournamentHandlers } from '../tournament/index';
