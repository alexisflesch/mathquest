// Shared handler for joining and answering in both quiz and tournament modes
import { Server as SocketIOServer, Socket } from 'socket.io';
import { calculateLeaderboard } from './sharedLeaderboard';
import { collectAnswers } from './sharedAnswers';
import { calculateScore } from './sharedScore';
import createLogger from '@/utils/logger';

const logger = createLogger('SharedLiveHandler');

interface JoinPayload {
    accessCode: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    playMode: 'quiz' | 'tournament' | 'practice';
}

interface AnswerPayload {
    accessCode: string;
    userId: string;
    questionId: string;
    answer: any;
    timeSpent: number;
    playMode: 'quiz' | 'tournament' | 'practice';
}

export function registerSharedLiveHandlers(io: SocketIOServer, socket: Socket) {
    // Join event for both quiz and tournament
    const joinHandler = async (payload: JoinPayload) => {
        const { accessCode, userId, username, avatarUrl, playMode } = payload;
        const room = `live_${accessCode}`;
        logger.info({ accessCode, userId, room, playMode }, '[DEBUG] Attempting to join room');
        socket.join(room);
        logger.info({ accessCode, userId, room, playMode }, '[DEBUG] Joined room');
        io.to(room).emit('participant_joined', { userId, username, avatarUrl, playMode });
        // Fetch game state for game_joined event
        const gameStateRaw = await import('@/core/gameStateService').then(m => m.getFullGameState(accessCode));
        let gameJoinPayload;
        if (gameStateRaw && gameStateRaw.gameState) {
            gameJoinPayload = {
                gameId: gameStateRaw.gameState.gameId,
                accessCode: gameStateRaw.gameState.accessCode,
                currentQuestion: gameStateRaw.gameState.currentQuestionIndex,
                totalQuestions: gameStateRaw.gameState.questionIds.length
            };
        } else {
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
            const redis = await import('@/config/redis').then(m => m.redisClient);
            // Map userId to socket.id for personalized emission
            await redis.hset(`mathquest:game:userIdToSocketId:${accessCode}`, payload.userId, socket.id);
            // Map socket.id to userId for disconnect cleanup
            await redis.hset(`mathquest:game:socketIdToUserId:${accessCode}`, socket.id, payload.userId);
            await redis.hset(
                `mathquest:game:participants:${accessCode}`,
                payload.userId,
                JSON.stringify({ userId, username, avatarUrl, score: 0 })
            );
        } catch (err) {
            logger.error({ err, accessCode, userId }, 'Failed to add participant to Redis');
        }

        logger.info({ accessCode, userId, playMode }, 'Participant joined live room');
    };

    // Answer event for both quiz and tournament
    const answerHandler = async (payload: AnswerPayload) => {
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
            const redis = await import('@/config/redis').then(m => m.redisClient);
            const participantsHash = await redis.hgetall(`mathquest:game:participants:${accessCode}`);
            const participants = participantsHash
                ? Object.values(participantsHash).map((p: any) => JSON.parse(p))
                : [];
            socket.emit('game_participants', { participants });
        } catch (err) {
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
