"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showCorrectAnswersHandler = showCorrectAnswersHandler;
const prisma_1 = require("@/db/prisma");
const events_1 = require("@shared/types/socket/events");
const logger_1 = __importDefault(require("@/utils/logger"));
const gameStateService_1 = require("@/core/services/gameStateService");
// Create a handler-specific logger
const logger = (0, logger_1.default)('ShowCorrectAnswersHandler');
/**
 * Handler for teacher's "show correct answers" action (trophy button)
 * Closes the question and displays correct answers to students and projection
 */
function showCorrectAnswersHandler(io, socket) {
    return async (payload) => {
        try {
            logger.info({ socketId: socket.id, payload }, 'Teacher requesting to show correct answers');
            const { gameId, accessCode, teacherId } = payload;
            // Use accessCode or gameId to find the game
            let gameInstance;
            if (accessCode) {
                gameInstance = await prisma_1.prisma.gameInstance.findUnique({
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
            }
            else if (gameId) {
                gameInstance = await prisma_1.prisma.gameInstance.findUnique({
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
                socket.emit(events_1.SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Game not found'
                });
                return;
            }
            // Fetch current question UID from game state (memory/redis)
            const fullState = await (0, gameStateService_1.getFullGameState)(gameInstance.accessCode);
            const gameState = fullState?.gameState;
            const currentQuestionUid = gameState && gameState.currentQuestionIndex >= 0 &&
                gameState.questionUids &&
                gameState.questionUids[gameState.currentQuestionIndex]
                ? gameState.questionUids[gameState.currentQuestionIndex]
                : null;
            if (!currentQuestionUid) {
                logger.error({ socketId: socket.id, accessCode: gameInstance.accessCode }, 'No current question set in game state');
                socket.emit(events_1.SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'No current question set in game state'
                });
                return;
            }
            // Find the current question in the template
            const questionWrapper = gameInstance.gameTemplate.questions.find(q => q.question.uid === currentQuestionUid);
            if (!questionWrapper) {
                logger.error({ socketId: socket.id, currentQuestionUid }, 'Current question not found in game template');
                socket.emit(events_1.SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Current question not found'
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
            io.to(gameRoom).emit(events_1.SOCKET_EVENTS.GAME.CORRECT_ANSWERS, correctAnswersPayload);
            logger.info({
                gameRoom,
                questionUid: question.uid,
                correctAnswers: question.correctAnswers
            }, 'Emitted correct answers to students');
            // Emit to projection room for display
            const projectionRoom = `projection_${gameInstance.id}`;
            io.to(projectionRoom).emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_CORRECT_ANSWERS, projectionCorrectAnswersPayload);
            // Persist correct answers state for projection page refresh
            await (0, gameStateService_1.updateProjectionDisplayState)(gameInstance.accessCode, {
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
            io.to(dashboardRoom).emit(events_1.SOCKET_EVENTS.TEACHER.SHOW_CORRECT_ANSWERS, { show: true });
            logger.info({
                dashboardRoom,
                show: true,
                event: events_1.SOCKET_EVENTS.TEACHER.SHOW_CORRECT_ANSWERS
            }, '[TROPHY_DEBUG] Emitted show_correct_answers to dashboard room');
            // TODO: Mark question as "closed" in game state if needed
            // This could involve updating Redis game state to track question status
            logger.info({
                socketId: socket.id,
                questionUid: question.uid,
                gameId: gameInstance.id,
                accessCode: gameInstance.accessCode
            }, 'Successfully processed show correct answers request');
        }
        catch (error) {
            logger.error({ socketId: socket.id, payload, error }, 'Error in show correct answers handler');
            socket.emit(events_1.SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                error: 'Failed to show correct answers'
            });
        }
    };
}
