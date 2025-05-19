"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameAnswerHandler = gameAnswerHandler;
const gameParticipantService_1 = require("@/core/services/gameParticipantService");
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('GameAnswerHandler');
function gameAnswerHandler(io, socket) {
    return async (payload) => {
        const { accessCode, playerId, questionId, answer, timeSpent } = payload;
        try {
            // Fetch game instance
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                where: { accessCode },
                select: {
                    id: true,
                    isDiffered: true,
                    differedAvailableFrom: true,
                    differedAvailableTo: true
                }
            });
            if (!gameInstance) {
                socket.emit('game_error', { message: 'Game not found.' });
                return;
            }
            // Differed mode window check
            if (gameInstance.isDiffered) {
                const now = new Date();
                const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
                const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;
                const inDifferedWindow = (!from || now >= from) && (!to || now <= to);
                if (!inDifferedWindow) {
                    socket.emit('game_error', { message: 'Differed mode not available at this time.' });
                    return;
                }
            }
            // Find participant
            const participant = await prisma_1.prisma.gameParticipant.findFirst({
                where: { gameInstanceId: gameInstance.id, playerId }
            });
            if (!participant) {
                socket.emit('game_error', { message: 'Participant not found.' });
                return;
            }
            // Prevent answer if already completed (differed mode)
            if (gameInstance.isDiffered && participant.completedAt) {
                socket.emit('game_error', { message: 'You have already completed this tournament.' });
                return;
            }
            // Submit answer
            const participantService = new gameParticipantService_1.GameParticipantService();
            await participantService.submitAnswer(participant.id, {
                questionUid: questionId,
                answer,
                timeTakenMs: timeSpent
            });
            // Mark completion if last question (differed mode only)
            // (Assume frontend signals last question or check answers count)
            // Optionally, update completedAt here if needed
            // Update leaderboard (emit to all for live, or just to user for differed)
            if (gameInstance.isDiffered) {
                // Emit updated leaderboard to this user only
                // (Leaderboard logic: fetch all participants, sort, send)
                const allParticipants = await prisma_1.prisma.gameParticipant.findMany({
                    where: { gameInstanceId: gameInstance.id },
                    orderBy: [{ score: 'desc' }, { timeTakenMs: 'asc' }]
                });
                socket.emit('leaderboard_update', { leaderboard: allParticipants });
            }
            else {
                // Emit to all in room
                const allParticipants = await prisma_1.prisma.gameParticipant.findMany({
                    where: { gameInstanceId: gameInstance.id },
                    orderBy: [{ score: 'desc' }, { timeTakenMs: 'asc' }]
                });
                io.to(`live_${accessCode}`).emit('leaderboard_update', { leaderboard: allParticipants });
            }
            socket.emit('answer_received', { questionId, timeSpent });
        }
        catch (err) {
            logger.error({ err, accessCode, playerId }, 'Error in gameAnswerHandler');
            socket.emit('game_error', { message: 'Internal error submitting answer.' });
        }
    };
}
