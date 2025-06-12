// Tournament handler for student-driven tournaments (Socket.IO)
// Uses shared game flow, leaderboard, answers, and score logic
import { Server as SocketIOServer, Socket } from 'socket.io'; // Added Socket import
import { runGameFlow, GameFlowOptions } from './sharedGameFlow';
import { TOURNAMENT_EVENTS, GAME_EVENTS, LOBBY_EVENTS } from '@shared/types/socket/events';
import createLogger from '@/utils/logger';
import { GameInstanceService } from '@/core/services/gameInstanceService';
import gameStateService from '@/core/gameStateService';
import { registerSharedLiveHandlers } from './sharedLiveHandler';

const logger = createLogger('TournamentHandler');
const gameInstanceService = new GameInstanceService();

interface StartTournamentPayload {
    accessCode: string;
}

/**
 * Register all tournament-related socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
export function tournamentHandler(io: SocketIOServer, socket: Socket) { // Changed ExtendedSocket to Socket
    // Register shared live handlers for join/answer
    registerSharedLiveHandlers(io, socket);

    // Start tournament event (student-creator only)
    socket.on(TOURNAMENT_EVENTS.START_TOURNAMENT, async (payload: StartTournamentPayload) => {
        logger.debug({ payload, socketId: socket.id }, '[DEBUG] Received start_tournament event');
        const { accessCode } = payload;
        logger.debug({ accessCode, socketId: socket.id }, '[DEBUG] Handling start_tournament for accessCode');

        // Fetch game instance, including gameTemplate.questions with actual question data, ordered by sequence
        // Also include participants to check if any are there.
        const gameInstance = await gameInstanceService.getGameInstanceByAccessCode(accessCode, true); // includeParticipants = true
        logger.debug({ accessCode, socketId: socket.id, found: !!gameInstance }, '[DEBUG] getGameInstanceByAccessCode result');

        if (!gameInstance) {
            logger.warn({ accessCode, socketId: socket.id }, '[DEBUG] Tournament not found');
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Tournament not found' });
            return;
        }

        logger.info({
            gameInstanceId: gameInstance.id,
            templateId: gameInstance.gameTemplateId,
            initiator: gameInstance.initiatorUserId,
            playMode: gameInstance.playMode,
            nbQuestionsFromTemplate: gameInstance.gameTemplate?.questions?.length,
            nbParticipants: gameInstance.participants?.length,
            accessCode,
            socketId: socket.id
        }, '[TournamentHandler] Fetched gameInstance for start_tournament');

        const authenticatedUserId = socket.data.user?.userId;
        logger.debug({
            accessCode,
            socketId: socket.id,
            authenticatedUserId,
            initiatorUserId: gameInstance.initiatorUserId,
            socketData: socket.data,
            socketUser: socket.data.user
        }, '[DEBUG] Checking authorization for start_tournament');
        if (!authenticatedUserId || gameInstance.initiatorUserId !== authenticatedUserId) {
            logger.warn({ authenticatedUserId, initiatorUserId: gameInstance.initiatorUserId, accessCode, socketId: socket.id }, '[DEBUG] Not authorized to start tournament');
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Not authorized to start this tournament' });
            return;
        }

        // Emit game_started to lobby for 5-second countdown (unified for all tournament/quiz modes)
        const tournamentRoom = `game_${accessCode}`;
        const lobbyRoom = `lobby_${accessCode}`;

        logger.debug({ accessCode, playMode: gameInstance.playMode, socketId: socket.id }, '[DEBUG] Emitting unified 5-second countdown for all tournament types');
        io.to(lobbyRoom).emit(LOBBY_EVENTS.GAME_STARTED, { accessCode, gameId: gameInstance.id });

        // Short delay to allow clients to process redirect before game state changes affect them
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay

        if (!gameInstance.gameTemplate || !gameInstance.gameTemplate.questions || gameInstance.gameTemplate.questions.length === 0) {
            logger.error({ accessCode, gameInstanceId: gameInstance.id, socketId: socket.id }, 'Game instance is missing game template or has no questions');
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Game configuration error: Missing template or no questions.' });
            return;
        }

        const actualQuestions = gameInstance.gameTemplate.questions
            .map(gtq => gtq.question)
            .filter(q => q != null); // Ensure question objects are not null

        if (actualQuestions.length === 0) {
            logger.error({ accessCode, gameInstanceId: gameInstance.id }, '[TournamentHandler] No valid questions found after mapping.');
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'No questions available for this game.' });
            return;
        }
        logger.debug({ actualQuestionsCount: actualQuestions.length, firstQuestion: actualQuestions[0]?.uid, accessCode, socketId: socket.id }, '[TournamentHandler] Mapped actualQuestions for runGameFlow');

        // Determine playMode for GameFlowOptions
        let flowPlayMode: 'quiz' | 'tournament';
        if (gameInstance.playMode === 'quiz' || gameInstance.playMode === 'tournament') {
            flowPlayMode = gameInstance.playMode;
        } else {
            logger.warn({ playMode: gameInstance.playMode, gameInstanceId: gameInstance.id }, 'Unexpected playMode for game flow, defaulting to "tournament"');
            flowPlayMode = 'tournament'; // Default or handle error appropriately
        }
        logger.debug({ accessCode, socketId: socket.id, flowPlayMode }, '[DEBUG] Determined playMode for GameFlowOptions');

        // Update game state in Redis before DB update and redirect logic
        try {
            await gameStateService.updateGameState(accessCode, {
                gameId: gameInstance.id,
                accessCode,
                status: 'active', // Set to active so clients joining live room see it as active
                currentQuestionIndex: -1, // Indicate that countdown is happening before Q0
                questionIds: actualQuestions.map(q => q.uid),
                timer: {
                    startedAt: Date.now(), // Placeholder, will be updated by game flow
                    duration: 0,
                    isPaused: true
                },
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                }
            });
            logger.debug({ accessCode, gameInstanceId: gameInstance.id, socketId: socket.id }, '[TournamentHandler] Game state updated in Redis prior to starting flow.');
        } catch (error) {
            logger.error({ error, accessCode, socketId: socket.id }, '[TournamentHandler] Failed to update game state in Redis.');
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Failed to initialize game state.' });
            return;
        }

        const gameFlowOptions: GameFlowOptions = {
            playMode: flowPlayMode,
        };

        await gameInstanceService.updateGameStatus(gameInstance.id, { status: 'active', currentQuestionIndex: -1 }); // currentQuestionIndex to -1 for countdown phase
        const liveRoom = `game_${accessCode}`;
        const countdownDuration = 5; // 5 seconds
        logger.debug({ accessCode, gameInstanceId: gameInstance.id, socketId: socket.id }, '[DEBUG] Updated game status to active (countdown phase)');
        logger.info({ room: liveRoom, duration: countdownDuration, accessCode, socketId: socket.id }, `[TournamentHandler] Emitting tournament_starting and waiting ${countdownDuration}s before starting game.`);

        // Start countdown with ticking - emit to both lobby and game rooms
        io.to(liveRoom).emit('tournament_starting', { countdown: countdownDuration });
        io.to(lobbyRoom).emit('tournament_starting', { countdown: countdownDuration });

        // Emit countdown tick every second to both rooms
        for (let i = countdownDuration; i > 0; i--) {
            logger.debug({ accessCode, countdown: i, socketId: socket.id }, `[TournamentHandler] Countdown tick: ${i}`);
            io.to(liveRoom).emit('countdown_tick', { countdown: i });
            io.to(lobbyRoom).emit('countdown_tick', { countdown: i });
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }

        logger.debug({ accessCode, gameInstanceId: gameInstance.id, socketId: socket.id }, `[TournamentHandler] Countdown complete. About to start game flow.`);
        io.to(liveRoom).emit('countdown_complete');
        io.to(lobbyRoom).emit('countdown_complete');
        logger.debug({ accessCode, gameInstanceId: gameInstance.id, socketId: socket.id }, `[TournamentHandler] Countdown finished. Calling runGameFlow.`);

        // Update currentQuestionIndex to 0 before starting game flow
        // Also ensure other required fields for GameState are present or updated as necessary
        const currentStateData = await gameStateService.getFullGameState(accessCode); // Changed getGameState to getFullGameState
        if (!currentStateData || !currentStateData.gameState) { // Check for gameState property
            logger.error({ accessCode, socketId: socket.id }, '[TournamentHandler] CRITICAL: Game state not found or incomplete before final update for runGameFlow. Aborting.');
            // Potentially emit an error to the room or handle more gracefully
            return;
        }

        await gameStateService.updateGameState(accessCode, {
            ...currentStateData.gameState, // Spread existing gameState
            currentQuestionIndex: 0,
            status: 'active', // Ensure status is still active
            timer: { // Reset or confirm timer state for the start of questions
                ...currentStateData.gameState.timer, // Access timer from gameState
                startedAt: Date.now(),
                isPaused: false // Game is starting, timer should not be paused
            }
        });

        await gameInstanceService.updateGameStatus(gameInstance.id, {
            status: 'active', // Required by GameStatusUpdateData
            currentQuestionIndex: 0
        });


        runGameFlow(
            io,
            accessCode,
            actualQuestions,
            gameFlowOptions
        );
        logger.debug({ accessCode, socketId: socket.id }, '[TournamentHandler] runGameFlow called for accessCode');
    });
}

export default tournamentHandler;
