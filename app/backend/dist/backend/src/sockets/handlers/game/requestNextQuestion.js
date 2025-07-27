"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestNextQuestionHandler = requestNextQuestionHandler;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const emitQuestionHandler_1 = require("./emitQuestionHandler");
const logger = (0, logger_1.default)('RequestNextQuestionHandler');
function requestNextQuestionHandler(io, socket) {
    // Use the canonical emitQuestionHandler for all question emission
    const emitQuestion = (0, emitQuestionHandler_1.emitQuestionHandler)(io, socket);
    return async (payload) => {
        logger.info({ payload }, '[DEBUG] requestNextQuestionHandler called');
        // Runtime validation with Zod
        const parseResult = socketEvents_zod_1.requestNextQuestionPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid requestNextQuestion payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');
            const errorPayload = {
                message: 'Invalid requestNextQuestion payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };
            socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
            return;
        }
        const validPayload = parseResult.data;
        const { accessCode, userId, currentQuestionUid } = validPayload;
        logger.info({ accessCode, userId, currentQuestionUid }, '[DEBUG] requestNextQuestionHandler params');
        try {
            logger.info({ socketId: socket.id, event: 'request_next_question', accessCode, userId, currentQuestionUid }, 'Player requested next question');
            // 1. Get game instance
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                where: { accessCode },
                select: {
                    id: true,
                    status: true,
                    playMode: true,
                    gameTemplateId: true
                }
            });
            if (!gameInstance) {
                const errorPayload = { message: 'Game not found.' };
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
                return;
            }
            // Allow request_next_question for practice mode
            if (gameInstance.playMode !== 'practice') {
                logger.warn({ accessCode, userId }, 'Request next question is only for practice mode.');
                const errorPayload = { message: 'This operation is only for practice mode.' };
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
                return;
            }
            // 2. Get participant
            const participant = await prisma_1.prisma.gameParticipant.findFirst({
                where: { gameInstanceId: gameInstance.id, userId }
            });
            if (!participant) {
                const errorPayload = { message: 'Participant not found.' };
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
                return;
            }
            // 3. Get all questions
            const allQuestions = await prisma_1.prisma.questionsInGameTemplate.findMany({
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
            }
            else if (allQuestions.length > 0) {
                nextQuestionUid = allQuestions[0].questionUid;
            }
            if (nextQuestionUid) {
                // Use canonical handler for emission and timing
                await emitQuestion({ accessCode, userId, questionUid: nextQuestionUid });
            }
            else {
                // All questions answered: compute and send final score
                const total = allQuestions.length;
                // TODO: Use canonical scoring/answer tracking if available
                // For now, just send GAME_ENDED event
                logger.info({ accessCode, userId, total }, 'Practice mode completed, sending final score');
                const gameEndedPayload = {
                    accessCode,
                    score: total, // Placeholder: should be correct count
                    totalQuestions: total,
                    correct: total,
                    total: total
                };
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ENDED, gameEndedPayload);
                logger.info({ participantId: participant.id }, 'Practice completed (no database update needed)');
            }
        }
        catch (err) {
            logger.error({ err, socketId: socket.id }, 'Error handling request_next_question');
            const errorPayload = { message: 'Error processing next question request.' };
            socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
        }
    };
}
