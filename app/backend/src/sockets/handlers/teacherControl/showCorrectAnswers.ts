import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { ShowCorrectAnswersPayload } from '@shared/types/socket/payloads';
import createLogger from '@/utils/logger';

// Create a handler-specific logger
const logger = createLogger('ShowCorrectAnswersHandler');

/**
 * Handler for teacher's "show correct answers" action (trophy button)
 * Closes the question and displays correct answers to students and projection
 */
export function showCorrectAnswersHandler(io: SocketIOServer, socket: Socket) {
    return async (payload: ShowCorrectAnswersPayload) => {
        try {
            logger.info({ socketId: socket.id, payload }, 'Teacher requesting to show correct answers');

            const { gameId, accessCode, questionUid, teacherId } = payload;

            // Validate required fields
            if (!questionUid) {
                logger.error({ socketId: socket.id, payload }, 'Missing questionUid in show correct answers request');
                socket.emit(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Missing question ID'
                });
                return;
            }

            // Use accessCode or gameId to find the game
            let gameInstance;
            if (accessCode) {
                gameInstance = await prisma.gameInstance.findUnique({
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
            } else if (gameId) {
                gameInstance = await prisma.gameInstance.findUnique({
                    where: { id: gameId },
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
            }

            if (!gameInstance) {
                logger.error({ socketId: socket.id, payload }, 'Game instance not found');
                socket.emit(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Game not found'
                });
                return;
            }

            // Find the specific question
            const questionWrapper = gameInstance.gameTemplate.questions.find(
                q => q.question.uid === questionUid
            );

            if (!questionWrapper) {
                logger.error({ socketId: socket.id, questionUid }, 'Question not found in game template');
                socket.emit(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Question not found'
                });
                return;
            }

            const question = questionWrapper.question;

            // Prepare correct answers payload for students
            const correctAnswersPayload = {
                questionUid: question.uid,
                correctAnswers: question.correctAnswers || []
            };

            // Prepare projection-specific payload with additional context
            const projectionCorrectAnswersPayload = {
                questionUid: question.uid,
                correctAnswers: question.correctAnswers || [],
                questionText: question.text,
                answerOptions: question.answerOptions,
                timestamp: Date.now()
            };

            // Emit to students in the game room
            const gameRoom = `game_${gameInstance.accessCode}`;
            io.to(gameRoom).emit(SOCKET_EVENTS.GAME.CORRECT_ANSWERS, correctAnswersPayload);

            logger.info({
                gameRoom,
                questionUid,
                correctAnswers: question.correctAnswers
            }, 'Emitted correct answers to students');

            // Emit to projection room for display
            const projectionRoom = `projection_${gameInstance.id}`;
            io.to(projectionRoom).emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_CORRECT_ANSWERS, projectionCorrectAnswersPayload);

            logger.info({
                projectionRoom,
                questionUid
            }, 'Emitted correct answers to projection room');

            // TODO: Mark question as "closed" in game state if needed
            // This could involve updating Redis game state to track question status

            logger.info({
                socketId: socket.id,
                questionUid,
                gameId: gameInstance.id,
                accessCode: gameInstance.accessCode
            }, 'Successfully processed show correct answers request');

        } catch (error) {
            logger.error({ socketId: socket.id, payload, error }, 'Error in show correct answers handler');
            socket.emit(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                error: 'Failed to show correct answers'
            });
        }
    };
}
