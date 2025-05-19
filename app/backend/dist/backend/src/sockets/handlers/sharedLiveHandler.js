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
exports.registerSharedLiveHandlers = registerSharedLiveHandlers;
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('SharedLiveHandler');
function registerSharedLiveHandlers(io, socket) {
    // Join event for both quiz and tournament
    const joinHandler = async (payload) => {
        const { accessCode, userId, username, avatarUrl, playMode } = payload;
        const room = `live_${accessCode}`;
        logger.info({ accessCode, userId, room, playMode }, '[DEBUG] Attempting to join room');
        socket.join(room);
        logger.info({ accessCode, userId, room, playMode }, '[DEBUG] Joined room');
        io.to(room).emit('participant_joined', { userId, username, avatarUrl, playMode });
        // Fetch game state for game_joined event
        const gameStateRaw = await Promise.resolve().then(() => __importStar(require('@/core/gameStateService'))).then(m => m.getFullGameState(accessCode));
        let gameJoinPayload;
        if (gameStateRaw && gameStateRaw.gameState) {
            gameJoinPayload = {
                gameId: gameStateRaw.gameState.gameId,
                accessCode: gameStateRaw.gameState.accessCode,
                currentQuestion: gameStateRaw.gameState.currentQuestionIndex,
                totalQuestions: gameStateRaw.gameState.questionIds.length
            };
        }
        else {
            gameJoinPayload = {
                gameId: '',
                accessCode,
                currentQuestion: -1,
                totalQuestions: 0
            };
        }
        socket.emit('game_joined', gameJoinPayload);
        logger.info({ accessCode, userId, room, playMode }, '[DEBUG] Emitted game_joined');
        // Add participant to Redis participants hash (by userId and socket.id for resilience)
        try {
            const redis = await Promise.resolve().then(() => __importStar(require('@/config/redis'))).then(m => m.redisClient);
            // Map userId to socket.id for personalized emission
            await redis.hset(`mathquest:game:userIdToSocketId:${accessCode}`, payload.userId, socket.id);
            // Map socket.id to userId for disconnect cleanup
            await redis.hset(`mathquest:game:socketIdToUserId:${accessCode}`, socket.id, payload.userId);
            await redis.hset(`mathquest:game:participants:${accessCode}`, payload.userId, JSON.stringify({ userId, username, avatarUrl, score: 0 }));
        }
        catch (err) {
            logger.error({ err, accessCode, userId }, 'Failed to add participant to Redis');
        }
        logger.info({ accessCode, userId, playMode }, 'Participant joined live room');
    };
    // Answer event for both quiz and tournament
    const answerHandler = async (payload) => {
        const { accessCode, userId, questionId, answer, timeSpent, playMode } = payload;
        logger.info({ accessCode, userId, questionId, playMode, answer }, '[DEBUG] Received answer');
        // TODO: Implement answer submission logic (store in Redis/DB)
        // For now, just emit answer_received for compatibility
        socket.emit('answer_received', { questionId, timeSpent });
        logger.info({ accessCode, userId, questionId, playMode }, '[DEBUG] Emitted answer_received');
    };
    // Handle request_participants event
    socket.on('request_participants', async ({ accessCode }) => {
        try {
            const redis = await Promise.resolve().then(() => __importStar(require('@/config/redis'))).then(m => m.redisClient);
            const participantsHash = await redis.hgetall(`mathquest:game:participants:${accessCode}`);
            const participants = participantsHash
                ? Object.values(participantsHash).map((p) => JSON.parse(p))
                : [];
            socket.emit('game_participants', { participants });
        }
        catch (err) {
            logger.error({ err, accessCode }, 'Failed to fetch participants for game_participants event');
            socket.emit('game_participants', { participants: [] });
        }
    });
    // Register both quiz and tournament events
    socket.on('join_game', (payload) => joinHandler({ ...payload, playMode: 'quiz' }));
    socket.on('join_tournament', (payload) => joinHandler({ ...payload, playMode: 'tournament' }));
    socket.on('game_answer', (payload) => answerHandler({ ...payload, playMode: 'quiz' }));
    socket.on('tournament_answer', (payload) => answerHandler({ ...payload, playMode: 'tournament' }));
}
