import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { ShowCorrectAnswersPayload } from '@shared/types/socket/payloads';
import createLogger from '@/utils/logger';
import { updateProjectionDisplayState, getFullGameState } from '@/core/services/gameStateService';

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

            const { gameId, accessCode, teacherId } = payload;

            // Validate accessCode and questionUid with Zod
            const { z } = await import('zod');
            const accessCodeSchema = z.string().min(1);

            if (!accessCodeSchema.safeParse(accessCode).success) {
                logger.error({ socketId: socket.id, payload }, 'Invalid accessCode');
                socket.emit(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Invalid access code'
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

            // Fetch current question UID from game state (memory/redis)
            const fullState = await getFullGameState(gameInstance.accessCode);
            const gameState = fullState?.gameState;
            const currentQuestionUid = gameState && gameState.currentQuestionIndex >= 0 &&
                gameState.questionUids &&
                gameState.questionUids[gameState.currentQuestionIndex]
                ? gameState.questionUids[gameState.currentQuestionIndex]
                : null;

            if (!currentQuestionUid) {
                logger.error({ socketId: socket.id, accessCode: gameInstance.accessCode }, 'No current question set in game state');
                const errorPayload: import('@shared/types/socketEvents').ErrorPayload = {
                    code: 'NO_CURRENT_QUESTION',
                    message: "Le quiz n'a pas encore commencé"
                };
                socket.emit(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, errorPayload);
                return;
            }

            // Find the current question in the template
            const questionWrapper = gameInstance.gameTemplate.questions.find(
                q => q.question.uid === currentQuestionUid
            );

            if (!questionWrapper) {
                logger.error({ socketId: socket.id, currentQuestionUid }, 'Current question not found in game template');
                socket.emit(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Current question not found'
                });
                return;
            }

            const question = questionWrapper.question;

            // Validate questionUid with Zod
            const questionUidSchema = z.string().min(1);
            if (!questionUidSchema.safeParse(question.uid).success) {
                logger.error({ socketId: socket.id, questionUid: question.uid }, 'Invalid questionUid');
                socket.emit(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Invalid questionUid'
                });
                return;
            }


            // --- MODERNIZATION: Fetch terminated questions from Redis and build map ---
            let terminatedQuestions: Record<string, boolean> = {};
            try {
                const terminatedKey = `mathquest:game:terminatedQuestions:${gameInstance.accessCode}`;
                const terminatedSet = await (await import('@/config/redis')).redisClient.smembers(terminatedKey);
                if (Array.isArray(terminatedSet)) {
                    terminatedSet.forEach((uid: string) => {
                        terminatedQuestions[uid] = true;
                    });
                }
            } catch (err) {
                logger.error({ err }, 'Failed to fetch terminated questions from Redis');
            }

            // Prepare correct answers payload for students and dashboard
            const correctAnswersPayload = {
                questionUid: question.uid,
                correctAnswers: question.correctAnswers || [],
                terminatedQuestions
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
                questionUid: question.uid,
                correctAnswers: question.correctAnswers
            }, 'Emitted correct answers to students');

            // Emit to projection room for display
            const projectionRoom = `projection_${gameInstance.id}`;
            io.to(projectionRoom).emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_CORRECT_ANSWERS, projectionCorrectAnswersPayload);

            // Persist correct answers state for projection page refresh
            await updateProjectionDisplayState(gameInstance.accessCode, {
                showCorrectAnswers: true,
                correctAnswersData: projectionCorrectAnswersPayload
            });

            logger.info({
                projectionRoom,
                questionUid: question.uid,
                statePersisted: true
            }, 'Emitted correct answers to projection room and persisted state');

            // Emit to dashboard room so teacher UI updates trophy state
            const dashboardRoom = `dashboard_${gameInstance.id}`;

            // --- MODERNIZATION: Track terminated questions in Redis ---
            // Use canonical key: mathquest:game:terminatedQuestions:{accessCode}
            const { redisClient } = await import('@/config/redis');
            const terminatedKey = `mathquest:game:terminatedQuestions:${gameInstance.accessCode}`;
            await redisClient.sadd(terminatedKey, question.uid);
            logger.info({ terminatedKey, questionUid: question.uid }, 'Marked question as terminated in Redis');

            // Re-fetch the set, but also optimistically add the just-terminated question
            let updatedTerminatedQuestions: Record<string, boolean> = {};
            try {
                const updatedSet = await redisClient.smembers(terminatedKey);
                if (Array.isArray(updatedSet)) {
                    updatedSet.forEach((uid: string) => {
                        updatedTerminatedQuestions[uid] = true;
                    });
                }
            } catch (err) {
                logger.error({ err }, 'Failed to fetch updated terminated questions from Redis');
            }
            // Optimistically add the just-terminated questionUid
            updatedTerminatedQuestions[question.uid] = true;

            // Emit to dashboard room with up-to-date terminatedQuestions map
            io.to(dashboardRoom).emit(SOCKET_EVENTS.TEACHER.SHOW_CORRECT_ANSWERS, { show: true, terminatedQuestions: updatedTerminatedQuestions });
            logger.info({
                dashboardRoom,
                show: true,
                event: SOCKET_EVENTS.TEACHER.SHOW_CORRECT_ANSWERS
            }, '[TROPHY_DEBUG] Emitted show_correct_answers to dashboard room (after Redis update, optimistic)');

            // TODO: Mark question as "closed" in game state if needed
            // This could involve updating Redis game state to track question status

            logger.info({
                socketId: socket.id,
                questionUid: question.uid,
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
