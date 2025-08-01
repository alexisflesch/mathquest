// Tournament handler for student-driven tournaments (Socket.IO)
// Uses shared game flow, leaderboard, answers, and score logic
import { Server as SocketIOServer, Socket } from 'socket.io'; // Added Socket import
import { runGameFlow, GameFlowOptions } from './sharedGameFlow';
import { TOURNAMENT_EVENTS, GAME_EVENTS, LOBBY_EVENTS } from '@shared/types/socket/events';
import createLogger from '@/utils/logger';
import { GameInstanceService } from '@/core/services/gameInstanceService';
import gameStateService from '@/core/services/gameStateService';
import { registerSharedLiveHandlers } from './sharedLiveHandler';
import { GameTimerState } from '@shared/types/core/timer';
import type { ErrorPayload } from '@shared/types/socketEvents';
import { startTournamentPayloadSchema } from '@shared/types/socketEvents.zod';

const logger = createLogger('TournamentHandler');
const gameInstanceService = new GameInstanceService();

/**
 * Register all tournament-related socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
export function tournamentHandler(io: SocketIOServer, socket: Socket) { // Changed ExtendedSocket to Socket
    // Register shared live handlers for join/answer
    registerSharedLiveHandlers(io, socket);

    // Start tournament event (student-creator only)
    socket.on(TOURNAMENT_EVENTS.START_TOURNAMENT, async (payload: any) => {
        // Runtime validation with Zod
        const parseResult = startTournamentPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid startTournament payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');

            const errorPayload: ErrorPayload = {
                message: 'Invalid startTournament payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };

            socket.emit(GAME_EVENTS.GAME_ERROR, errorPayload);
            return;
        }

        const { accessCode } = parseResult.data;
        logger.debug({ accessCode, socketId: socket.id }, 'Handling start_tournament for accessCode');

        // Fetch game instance, including gameTemplate.questions with actual question data, ordered by sequence
        // Also include participants to check if any are there.
        const gameInstance = await gameInstanceService.getGameInstanceByAccessCode(accessCode, true); // includeParticipants = true
        logger.debug({ accessCode, socketId: socket.id, found: !!gameInstance }, '[DEBUG] getGameInstanceByAccessCode result');

        if (!gameInstance) {
            logger.warn({ accessCode, socketId: socket.id }, '[DEBUG] Tournament not found');
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Tournament not found' } as ErrorPayload);
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
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Not authorized to start this tournament' } as ErrorPayload);
            return;
        }

        // Handle quiz vs tournament modes differently
        const tournamentRoom = `game_${accessCode}`;
        const lobbyRoom = `lobby_${accessCode}`;

        if (gameInstance.playMode === 'quiz') {
            // Quiz mode: Send immediate redirect event (no countdown)
            logger.debug({ accessCode, playMode: gameInstance.playMode, socketId: socket.id }, '[DEBUG] Quiz mode: Emitting immediate redirect');
            io.to(lobbyRoom).emit(LOBBY_EVENTS.GAME_STARTED, { accessCode, gameId: gameInstance.id });

            // Short delay to allow clients to process redirect before game state changes affect them
            await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
        } else {
            // Tournament mode: Only do countdown (no immediate redirect)
            logger.debug({ accessCode, playMode: gameInstance.playMode, socketId: socket.id }, '[DEBUG] Tournament mode: Starting 5-second countdown without immediate redirect');
        }

        if (!gameInstance.gameTemplate || !gameInstance.gameTemplate.questions || gameInstance.gameTemplate.questions.length === 0) {
            logger.error({ accessCode, gameInstanceId: gameInstance.id, socketId: socket.id }, 'Game instance is missing game template or has no questions');
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Game configuration error: Missing template or no questions.' } as ErrorPayload);
            return;
        }

        const actualQuestions = gameInstance.gameTemplate.questions
            .map(gtq => gtq.question)
            .filter(q => q != null); // Ensure question objects are not null

        if (actualQuestions.length === 0) {
            logger.error({ accessCode, gameInstanceId: gameInstance.id }, '[TournamentHandler] No valid questions found after mapping.');
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'No questions available for this game.' } as ErrorPayload);
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
                questionUids: actualQuestions.map(q => q.uid),
                answersLocked: false, // Default to unlocked
                gameMode: 'tournament', // Tournament mode
                // [MODERNIZATION] timer field removed. All timer state is managed by CanonicalTimerService.
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                }
            });
            logger.debug({ accessCode, gameInstanceId: gameInstance.id, socketId: socket.id }, '[TournamentHandler] Game state updated in Redis prior to starting flow.');
        } catch (error) {
            logger.error({ error, accessCode, socketId: socket.id }, '[TournamentHandler] Failed to update game state in Redis.');
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Failed to initialize game state.' } as ErrorPayload);
            return;
        }

        const gameFlowOptions: GameFlowOptions = {
            playMode: flowPlayMode,
        };

        if (gameInstance.playMode === 'tournament') {
            // Tournament mode: Do the 5-second countdown
            // Keep game status as 'pending' during countdown so late joiners go to lobby, not game room
            const liveRoom = `game_${accessCode}`;
            const countdownDuration = 5; // 5 seconds
            logger.info({ room: liveRoom, duration: countdownDuration, accessCode, socketId: socket.id }, `[TournamentHandler] Tournament mode: Starting ${countdownDuration}s countdown.`);

            // Start countdown with ticking - emit to both lobby and game rooms
            io.to(liveRoom).emit('tournament_starting', { countdown: countdownDuration }); // TODO: Define shared type if missing
            io.to(lobbyRoom).emit('tournament_starting', { countdown: countdownDuration }); // TODO: Define shared type if missing

            // Emit countdown tick every second to both rooms
            for (let i = countdownDuration; i > 0; i--) {
                logger.debug({ accessCode, countdown: i, socketId: socket.id }, `[TournamentHandler] Countdown tick: ${i}`);
                io.to(liveRoom).emit('countdown_tick', { countdown: i }); // TODO: Define shared type if missing
                io.to(lobbyRoom).emit('countdown_tick', { countdown: i }); // TODO: Define shared type if missing
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            }

            // NOW set game status to active after countdown completes
            await gameInstanceService.updateGameStatus(gameInstance.id, { status: 'active', currentQuestionIndex: 0 });
            logger.debug({ accessCode, gameInstanceId: gameInstance.id, socketId: socket.id }, `[TournamentHandler] Countdown complete. Game marked as active.`);
            io.to(liveRoom).emit('countdown_complete'); // TODO: Define shared type if missing
            io.to(lobbyRoom).emit('countdown_complete'); // TODO: Define shared type if missing
        } else {
            // Quiz mode: Skip countdown and go directly to game
            logger.info({ accessCode, gameInstanceId: gameInstance.id, socketId: socket.id }, `[TournamentHandler] Quiz mode: Skipping countdown, starting game immediately.`);
            await gameInstanceService.updateGameStatus(gameInstance.id, { status: 'active', currentQuestionIndex: 0 });
        }

        logger.debug({ accessCode, gameInstanceId: gameInstance.id, socketId: socket.id }, `[TournamentHandler] Ready to start game flow.`);

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
            status: 'active' // Ensure status is still active
            // [MODERNIZATION] timer field removed. All timer state is managed by CanonicalTimerService.
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
