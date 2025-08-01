"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showCorrectAnswersHandler = showCorrectAnswersHandler;
const prisma_1 = require("@/db/prisma");
const events_1 = require("@shared/types/socket/events");
const logger_1 = __importDefault(require("@/utils/logger"));
const gameStateService_1 = require("@/core/services/gameStateService");
const gameTimings_1 = require("@shared/constants/gameTimings");
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
            // Validate accessCode and questionUid with Zod
            const { z } = await Promise.resolve().then(() => __importStar(require('zod')));
            const accessCodeSchema = z.string().min(1);
            if (!accessCodeSchema.safeParse(accessCode).success) {
                logger.error({ socketId: socket.id, payload }, 'Invalid accessCode');
                socket.emit(events_1.SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Invalid access code'
                });
                return;
            }
            // Use accessCode or gameId to find the game
            let gameInstance;
            if (accessCode) {
                gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                    where: { accessCode },
                    include: {
                        gameTemplate: {
                            include: {
                                questions: {
                                    include: {
                                        question: {
                                            include: {
                                                multipleChoiceQuestion: true,
                                                numericQuestion: true,
                                            }
                                        }
                                    },
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
                                    include: {
                                        question: {
                                            include: {
                                                multipleChoiceQuestion: true,
                                                numericQuestion: true,
                                            }
                                        }
                                    },
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
                const errorPayload = {
                    code: 'NO_CURRENT_QUESTION',
                    message: "Le quiz n'a pas encore commencé"
                };
                socket.emit(events_1.SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, errorPayload);
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
            // Validate questionUid with Zod
            const questionUidSchema = z.string().min(1);
            if (!questionUidSchema.safeParse(question.uid).success) {
                logger.error({ socketId: socket.id, questionUid: question.uid }, 'Invalid questionUid');
                socket.emit(events_1.SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, {
                    error: 'Invalid questionUid'
                });
                return;
            }
            // --- MODERNIZATION: Fetch terminated questions from Redis and build map ---
            let terminatedQuestions = {};
            try {
                const terminatedKey = `mathquest:game:terminatedQuestions:${gameInstance.accessCode}`;
                const terminatedSet = await (await Promise.resolve().then(() => __importStar(require('@/config/redis')))).redisClient.smembers(terminatedKey);
                if (Array.isArray(terminatedSet)) {
                    terminatedSet.forEach((uid) => {
                        terminatedQuestions[uid] = true;
                    });
                }
            }
            catch (err) {
                logger.error({ err }, 'Failed to fetch terminated questions from Redis');
            }
            // Prepare correct answers payload based on question type
            let correctAnswers = [];
            let answerOptions = [];
            if (question.questionType === 'multipleChoice' && question.multipleChoiceQuestion) {
                correctAnswers = question.multipleChoiceQuestion.correctAnswers;
                answerOptions = question.multipleChoiceQuestion.answerOptions;
            }
            else if (question.questionType === 'numeric' && question.numericQuestion) {
                correctAnswers = [question.numericQuestion.correctAnswer];
            }
            // Prepare correct answers payload for students and dashboard
            const correctAnswersPayload = {
                questionUid: question.uid,
                correctAnswers: correctAnswers,
                terminatedQuestions
            };
            // Prepare projection-specific payload with additional context
            const projectionCorrectAnswersPayload = {
                questionUid: question.uid,
                correctAnswers: correctAnswers,
                questionText: question.text,
                answerOptions: answerOptions,
                timestamp: Date.now()
            };
            // Emit to students in the game room
            const gameRoom = `game_${gameInstance.accessCode}`;
            io.to(gameRoom).emit(events_1.SOCKET_EVENTS.GAME.CORRECT_ANSWERS, correctAnswersPayload);
            logger.info({
                gameRoom,
                questionUid: question.uid,
                correctAnswers: correctAnswers
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
            // --- MODERNIZATION: Track terminated questions in Redis ---
            // Use canonical key: mathquest:game:terminatedQuestions:{accessCode}
            const { redisClient } = await Promise.resolve().then(() => __importStar(require('@/config/redis')));
            const terminatedKey = `mathquest:game:terminatedQuestions:${gameInstance.accessCode}`;
            await redisClient.sadd(terminatedKey, question.uid);
            logger.info({ terminatedKey, questionUid: question.uid }, 'Marked question as terminated in Redis');
            // Re-fetch the set, but also optimistically add the just-terminated question
            let updatedTerminatedQuestions = {};
            try {
                const updatedSet = await redisClient.smembers(terminatedKey);
                if (Array.isArray(updatedSet)) {
                    updatedSet.forEach((uid) => {
                        updatedTerminatedQuestions[uid] = true;
                    });
                }
            }
            catch (err) {
                logger.error({ err }, 'Failed to fetch updated terminated questions from Redis');
            }
            // Optimistically add the just-terminated questionUid
            updatedTerminatedQuestions[question.uid] = true;
            // Emit to dashboard room with up-to-date terminatedQuestions map
            io.to(dashboardRoom).emit(events_1.SOCKET_EVENTS.TEACHER.SHOW_CORRECT_ANSWERS, { show: true, terminatedQuestions: updatedTerminatedQuestions });
            logger.info({
                dashboardRoom,
                show: true,
                event: events_1.SOCKET_EVENTS.TEACHER.SHOW_CORRECT_ANSWERS
            }, '[TROPHY_DEBUG] Emitted show_correct_answers to dashboard room (after Redis update, optimistic)');
            // Automatic progression logic - ONLY for tournament mode
            // In quiz mode, the teacher controls question progression manually
            if (gameInstance.playMode === 'tournament') {
                const handleAutomaticProgression = async () => {
                    try {
                        // Two separate timing concerns:
                        // 1. Time to show correct answers before proceeding (1.5s for all modes)
                        const correctAnswersDisplayTime = (0, gameTimings_1.getCorrectAnswersDisplayTime)(gameInstance.playMode);
                        // 2. Feedback display duration (from question or default to 5s)
                        const feedbackDisplayTime = (0, gameTimings_1.getFeedbackDisplayTime)(question.feedbackWaitTime);
                        logger.info({
                            questionUid: question.uid,
                            correctAnswersDisplayTime,
                            feedbackDisplayTime,
                            playMode: gameInstance.playMode,
                            questionFeedbackWaitTime: question.feedbackWaitTime
                        }, '[TROPHY_DEBUG] Starting automatic progression with proper timing constants (tournament mode only)');
                        // Wait for correct answers display duration
                        await new Promise((resolve) => setTimeout(resolve, correctAnswersDisplayTime * 1000));
                        // Emit feedback event if there's an explanation
                        if (question.explanation) {
                            const feedbackPayload = {
                                questionUid: question.uid,
                                feedbackRemaining: feedbackDisplayTime,
                                explanation: question.explanation
                            };
                            io.to(gameRoom).emit('feedback', feedbackPayload);
                            logger.info({
                                accessCode: gameInstance.accessCode,
                                questionUid: question.uid,
                                hasExplanation: true,
                                feedbackDisplayTime
                            }, '[TROPHY_DEBUG] Emitted feedback with explanation');
                            // Wait for feedback display duration
                            await new Promise((resolve) => setTimeout(resolve, feedbackDisplayTime * 1000));
                        }
                        // Check if there's a next question to auto-advance to
                        const currentIndex = gameState?.currentQuestionIndex ?? -1;
                        const allQuestions = gameInstance.gameTemplate.questions;
                        if (currentIndex >= 0 && currentIndex < allQuestions.length - 1) {
                            // There is a next question - auto advance
                            const nextIndex = currentIndex + 1;
                            const nextQuestion = allQuestions[nextIndex];
                            logger.info({
                                accessCode: gameInstance.accessCode,
                                currentIndex,
                                nextIndex,
                                nextQuestionUid: nextQuestion.question.uid
                            }, '[TROPHY_DEBUG] Auto-advancing to next question (tournament mode)');
                            // Update game state to next question
                            const { updateGameState, getFullGameState } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameStateService')));
                            const currentFullState = await getFullGameState(gameInstance.accessCode);
                            if (currentFullState && currentFullState.gameState) {
                                const updatedGameState = {
                                    ...currentFullState.gameState,
                                    currentQuestionIndex: nextIndex
                                };
                                await updateGameState(gameInstance.accessCode, updatedGameState);
                            }
                            // Use emitQuestionHandler to emit the next question to all players
                            const { emitQuestionHandler } = await Promise.resolve().then(() => __importStar(require('../game/emitQuestionHandler')));
                            // Create a temporary socket for the emission (teacher initiating)
                            const emitQuestion = emitQuestionHandler(io, socket);
                            // Emit to all participants in the game
                            const participants = await prisma_1.prisma.gameParticipant.findMany({
                                where: { gameInstanceId: gameInstance.id },
                                include: { user: true }
                            });
                            for (const participant of participants) {
                                await emitQuestion({
                                    accessCode: gameInstance.accessCode,
                                    userId: participant.userId,
                                    questionUid: nextQuestion.question.uid
                                });
                            }
                            logger.info({
                                accessCode: gameInstance.accessCode,
                                nextQuestionUid: nextQuestion.question.uid,
                                participantCount: participants.length
                            }, '[TROPHY_DEBUG] Successfully emitted next question to all participants (tournament mode)');
                        }
                        else {
                            logger.info({
                                accessCode: gameInstance.accessCode,
                                currentIndex,
                                totalQuestions: allQuestions.length
                            }, '[TROPHY_DEBUG] No next question available - game completed or staying on current question (tournament mode)');
                        }
                    }
                    catch (error) {
                        logger.error({
                            accessCode: gameInstance.accessCode,
                            questionUid: question.uid,
                            error
                        }, '[TROPHY_DEBUG] Error in automatic progression (tournament mode)');
                    }
                };
                // Start automatic progression in background (don't await to avoid blocking response)
                handleAutomaticProgression();
            }
            else {
                logger.info({
                    accessCode: gameInstance.accessCode,
                    playMode: gameInstance.playMode,
                    questionUid: question.uid
                }, '[TROPHY_DEBUG] Skipping automatic progression - quiz mode requires manual teacher control');
            }
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
