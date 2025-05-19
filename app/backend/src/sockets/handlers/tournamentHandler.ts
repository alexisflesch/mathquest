// Tournament handler for student-driven tournaments (Socket.IO)
// Uses shared game flow, leaderboard, answers, and score logic
import { Server as SocketIOServer, Socket } from 'socket.io';
import { runGameFlow } from './sharedGameFlow';
import { calculateLeaderboard } from './sharedLeaderboard';
import { collectAnswers } from './sharedAnswers';
import { calculateScore } from './sharedScore';
import createLogger from '@/utils/logger';
import { GameInstanceService } from '@/core/services/gameInstanceService';
import { registerSharedLiveHandlers } from './sharedLiveHandler';

const logger = createLogger('TournamentHandler');
const gameInstanceService = new GameInstanceService();

/**
 * Register all tournament-related socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
export function tournamentHandler(io: SocketIOServer, socket: Socket) {
    // Register shared live handlers for join/answer
    registerSharedLiveHandlers(io, socket);

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
            runGameFlow(io, accessCode, questions, {
                playMode: 'tournament',
                // Remove onQuestionEnd/onFeedback: handled in sharedGameFlow now
                onGameEnd: async () => {
                    // Compute leaderboard and persist to DB
                    const leaderboard = await calculateLeaderboard(accessCode);
                    logger.info({ accessCode, leaderboard }, '[DEBUG] Tournament ended, leaderboard calculated');
                    await import('./sharedLeaderboard').then(m => m.persistLeaderboardToGameInstance(accessCode, leaderboard));
                    // Emit message to frontend to redirect to leaderboard page
                    io.to(`live_${accessCode}`).emit('redirect_to_leaderboard');
                }
            });
        }, 5000);
    });
}

export default tournamentHandler;
