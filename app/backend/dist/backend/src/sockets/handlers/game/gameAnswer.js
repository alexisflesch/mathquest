"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameAnswerHandler = gameAnswerHandler;
const gameParticipantService_1 = require("@/core/services/gameParticipantService");
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const sharedLeaderboard_1 = require("../sharedLeaderboard");
const logger = (0, logger_1.default)('GameAnswerHandler');
function gameAnswerHandler(io, socket) {
    logger.info({ socketId: socket.id }, 'gameAnswerHandler registered');
    // Define the handler function
    const handler = async (payload) => {
        // First log to ensure we're receiving the event
        console.log('[GAME_ANSWER EVENT RECEIVED]', payload, 'Socket ID:', socket.id, 'Connected:', socket.connected);
        logger.info({ socketId: socket.id, event: 'game_answer', payload, connected: socket.connected }, 'TOP OF HANDLER: gameAnswerHandler invoked');
        // Zod validation for payload
        const parseResult = socketEvents_zod_1.gameAnswerPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid payload',
                details: errorDetails
            }, 'Invalid game answer payload');
            const errorPayload = {
                message: 'Invalid game answer payload',
                code: 'INVALID_PAYLOAD',
                details: errorDetails
            };
            // Emit error response
            socket.emit('game_error', errorPayload);
            return;
        }
        const { accessCode, userId, questionId, answer, timeSpent } = parseResult.data;
        try {
            logger.debug({ accessCode, userId, questionId, answer, timeSpent }, 'Looking up gameInstance');
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                where: { accessCode },
                select: {
                    id: true,
                    isDiffered: true,
                    differedAvailableFrom: true,
                    differedAvailableTo: true,
                    initiatorUserId: true,
                    playMode: true
                }
            });
            logger.debug({ gameInstance }, 'Result of gameInstance lookup');
            if (!gameInstance) {
                logger.warn({ socketId: socket.id, error: 'Game not found', accessCode }, 'EARLY RETURN: Game instance not found');
                const errorPayload = { message: 'Game not found.' };
                logger.warn({ errorPayload, accessCode, userId, questionId }, 'Emitting game_error: game not found');
                socket.emit('game_error', errorPayload);
                return;
            }
            if (gameInstance.isDiffered) {
                const now = new Date();
                const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
                const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;
                const inDifferedWindow = (!from || now >= from) && (!to || now <= to);
                logger.debug({ inDifferedWindow, from, to, now }, 'Checking differed window');
                if (!inDifferedWindow) {
                    logger.warn({ socketId: socket.id, error: 'Differed mode not available', accessCode }, 'EARLY RETURN: Differed window not available');
                    const errorPayload = { message: 'Differed mode not available at this time.' };
                    logger.warn({ errorPayload, accessCode, userId, questionId }, 'Emitting game_error: differed window not available');
                    socket.emit('game_error', errorPayload);
                    return;
                }
            }
            // Extra logging before participant lookup
            logger.debug({ accessCode, userId, questionId }, 'Looking up participant');
            let participant;
            try {
                participant = await prisma_1.prisma.gameParticipant.findFirst({
                    where: { gameInstanceId: gameInstance.id, userId },
                    include: { user: true }
                });
            }
            catch (err) {
                logger.error({ err, accessCode, userId, questionId }, 'Error during participant lookup');
                socket.emit('game_error', { message: 'Error looking up participant.' });
                return;
            }
            logger.debug({ participant }, 'Result of participant lookup');
            if (!participant) {
                logger.warn({ socketId: socket.id, error: 'Participant not found', userId, gameInstanceId: gameInstance.id }, 'EARLY RETURN: Participant not found');
                const errorPayload = { message: 'Participant not found.' };
                logger.warn({ errorPayload, accessCode, userId, questionId }, 'Emitting game_error: participant not found');
                socket.emit('game_error', errorPayload);
                return;
            }
            if (gameInstance.isDiffered && participant.completedAt) {
                logger.warn({ socketId: socket.id, error: 'Already completed', userId, gameInstanceId: gameInstance.id }, 'EARLY RETURN: Already completed tournament');
                const errorPayload = { message: 'You have already completed this tournament.' };
                logger.warn({ errorPayload }, 'Emitting game_error: already completed');
                socket.emit('game_error', errorPayload);
                return;
            }
            const participantService = new gameParticipantService_1.GameParticipantService();
            logger.debug({ userId, gameInstanceId: gameInstance.id, questionId, answer, timeSpent }, 'Calling participantService.submitAnswer');
            await participantService.submitAnswer(gameInstance.id, userId, {
                questionUid: questionId,
                answer,
                timeTakenMs: timeSpent
            });
            // Refetch participant to get updated score
            const updatedParticipant = await prisma_1.prisma.gameParticipant.findUnique({
                where: { id: participant.id },
                include: { user: true }
            });
            logger.debug({ updatedParticipant }, 'Result of updated participant lookup');
            if (!updatedParticipant || !updatedParticipant.user) {
                logger.warn({ socketId: socket.id, error: 'Error fetching updated participant', participantId: participant.id }, 'EARLY RETURN: Error fetching updated participant');
                // This should ideally not happen if the previous findFirst succeeded
                const errorPayload = { message: 'Error fetching updated participant data.' };
                logger.warn({ errorPayload }, 'Emitting game_error: error fetching updated participant');
                socket.emit('game_error', errorPayload);
                return;
            }
            // Use shared leaderboard calculation
            const leaderboard = await (0, sharedLeaderboard_1.calculateLeaderboard)(accessCode);
            logger.debug({ leaderboard }, 'Leaderboard data');
            if (gameInstance.isDiffered) {
                logger.info({ leaderboard }, 'Emitting leaderboard_update (differed)');
                socket.emit('leaderboard_update', { leaderboard });
            }
            else {
                let roomName = accessCode;
                if (gameInstance.playMode === 'quiz' && gameInstance.initiatorUserId) {
                    roomName = `teacher_${gameInstance.initiatorUserId}_${accessCode}`;
                }
                else if (gameInstance.playMode === 'tournament') {
                    roomName = `tournament_${accessCode}`;
                }
                logger.info({ leaderboard, roomName }, 'Emitting leaderboard_update to room');
                io.to(roomName).emit('leaderboard_update', { leaderboard });
            }
            logger.info({ questionId, timeSpent }, 'Emitting answer_received');
            try {
                // Make sure we send back a response even if something fails
                socket.emit('answer_received', { questionId, timeSpent });
                console.log(`[GAME_ANSWER] Successfully emitted answer_received for question ${questionId} to socket ${socket.id}`);
            }
            catch (emitError) {
                logger.error({ emitError, socketId: socket.id }, 'Error emitting answer_received');
                console.error('[GAME_ANSWER] Error emitting answer_received:', emitError);
            }
        }
        catch (err) {
            logger.error({ err, accessCode, userId, questionId }, 'Unexpected error in gameAnswerHandler');
            try {
                // Try to send error response
                socket.emit('game_error', { message: 'Unexpected error during answer submission.' });
                // Also send back answer_received to unblock the client
                if (questionId && timeSpent !== undefined) {
                    socket.emit('answer_received', { questionId, timeSpent });
                    console.log(`[GAME_ANSWER] Sent fallback answer_received after error for question ${questionId}`);
                }
            }
            catch (emitError) {
                logger.error({ emitError, socketId: socket.id }, 'Error sending error response');
            }
        }
    };
    // Add the handler to the socket
    socket.on('game_answer', handler);
    return handler;
}
