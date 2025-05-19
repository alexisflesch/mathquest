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
exports.tournamentHandler = tournamentHandler;
const sharedGameFlow_1 = require("./sharedGameFlow");
const sharedLeaderboard_1 = require("./sharedLeaderboard");
const logger_1 = __importDefault(require("@/utils/logger"));
const gameInstanceService_1 = require("@/core/services/gameInstanceService");
const sharedLiveHandler_1 = require("./sharedLiveHandler");
const logger = (0, logger_1.default)('TournamentHandler');
const gameInstanceService = new gameInstanceService_1.GameInstanceService();
/**
 * Register all tournament-related socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
function tournamentHandler(io, socket) {
    // Register shared live handlers for join/answer
    (0, sharedLiveHandler_1.registerSharedLiveHandlers)(io, socket);
    // Start tournament event (student-creator only)
    socket.on('start_tournament', async (payload) => {
        logger.info({ payload }, '[DEBUG] Received start_tournament event');
        const { accessCode, questions } = payload;
        // Fetch game instance and check authorization
        const gameInstance = await gameInstanceService.getGameInstanceByAccessCode(accessCode);
        logger.info({ accessCode, gameInstanceId: gameInstance?.id }, '[DEBUG] Fetched gameInstance for start_tournament');
        if (!gameInstance) {
            logger.warn({ accessCode }, '[DEBUG] Tournament not found');
            socket.emit('game_error', { message: 'Tournament not found' });
            return;
        }
        // Only the student-creator can start
        const socketUserId = socket.data.userId;
        logger.info({ socketUserId, initiatorUserId: gameInstance.initiatorUserId }, '[DEBUG] Checking tournament start authorization');
        if (!socketUserId || gameInstance.initiatorUserId !== socketUserId) {
            logger.warn({ socketUserId, initiatorUserId: gameInstance.initiatorUserId }, '[DEBUG] Not authorized to start tournament');
            socket.emit('game_error', { message: 'Not authorized to start this tournament' });
            return;
        }
        // Update game status to active
        await gameInstanceService.updateGameStatus(gameInstance.id, { status: 'active', currentQuestionIndex: 0 });
        logger.info({ accessCode }, '[DEBUG] Updated game status to active');
        // Wait 5s before redirecting lobby to live
        setTimeout(() => {
            logger.info({ accessCode }, '[DEBUG] Emitting redirect_to_game to lobby');
            io.to(`lobby_${accessCode}`).emit('redirect_to_game');
            // Start the tournament game flow
            logger.info({ accessCode, questionsCount: questions.length }, '[DEBUG] Starting runGameFlow for tournament');
            (0, sharedGameFlow_1.runGameFlow)(io, accessCode, questions, {
                playMode: 'tournament',
                // Remove onQuestionEnd/onFeedback: handled in sharedGameFlow now
                onGameEnd: async () => {
                    // Compute leaderboard and persist to DB
                    const leaderboard = await (0, sharedLeaderboard_1.calculateLeaderboard)(accessCode);
                    logger.info({ accessCode, leaderboard }, '[DEBUG] Tournament ended, leaderboard calculated');
                    await Promise.resolve().then(() => __importStar(require('./sharedLeaderboard'))).then(m => m.persistLeaderboardToGameInstance(accessCode, leaderboard));
                    // Emit message to frontend to redirect to leaderboard page
                    io.to(`live_${accessCode}`).emit('redirect_to_leaderboard');
                }
            });
        }, 5000);
    });
}
exports.default = tournamentHandler;
