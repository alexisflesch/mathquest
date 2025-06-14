"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tournamentHandler = tournamentHandler;
const sharedGameFlow_1 = require("./sharedGameFlow");
const events_1 = require("@shared/types/socket/events");
const logger_1 = __importDefault(require("@/utils/logger"));
const gameInstanceService_1 = require("@/core/services/gameInstanceService");
const gameStateService_1 = __importDefault(require("@/core/gameStateService"));
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
    socket.on(events_1.TOURNAMENT_EVENTS.START_TOURNAMENT, async (payload) => {
        logger.debug({ payload, socketId: socket.id }, '[DEBUG] Received start_tournament event');
        const { accessCode } = payload;
        logger.debug({ accessCode, socketId: socket.id }, '[DEBUG] Handling start_tournament for accessCode');
        // Fetch game instance, including gameTemplate.questions with actual question data, ordered by sequence
        // Also include participants to check if any are there.
        const gameInstance = await gameInstanceService.getGameInstanceByAccessCode(accessCode, true); // includeParticipants = true
        logger.debug({ accessCode, socketId: socket.id, found: !!gameInstance }, '[DEBUG] getGameInstanceByAccessCode result');
        if (!gameInstance) {
            logger.warn({ accessCode, socketId: socket.id }, '[DEBUG] Tournament not found');
            socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'Tournament not found' });
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
            socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'Not authorized to start this tournament' });
            return;
        }
        // Emit game_started to lobby for 5-second countdown (unified for all tournament/quiz modes)
        const tournamentRoom = `game_${accessCode}`;
        const lobbyRoom = `lobby_${accessCode}`;
        logger.debug({ accessCode, playMode: gameInstance.playMode, socketId: socket.id }, '[DEBUG] Emitting unified 5-second countdown for all tournament types');
        io.to(lobbyRoom).emit(events_1.LOBBY_EVENTS.GAME_STARTED, { accessCode, gameId: gameInstance.id }); // TODO: Define shared type if missing
        // Short delay to allow clients to process redirect before game state changes affect them
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
        if (!gameInstance.gameTemplate || !gameInstance.gameTemplate.questions || gameInstance.gameTemplate.questions.length === 0) {
            logger.error({ accessCode, gameInstanceId: gameInstance.id, socketId: socket.id }, 'Game instance is missing game template or has no questions');
            socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'Game configuration error: Missing template or no questions.' });
            return;
        }
        const actualQuestions = gameInstance.gameTemplate.questions
            .map(gtq => gtq.question)
            .filter(q => q != null); // Ensure question objects are not null
        if (actualQuestions.length === 0) {
            logger.error({ accessCode, gameInstanceId: gameInstance.id }, '[TournamentHandler] No valid questions found after mapping.');
            socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'No questions available for this game.' });
            return;
        }
        logger.debug({ actualQuestionsCount: actualQuestions.length, firstQuestion: actualQuestions[0]?.uid, accessCode, socketId: socket.id }, '[TournamentHandler] Mapped actualQuestions for runGameFlow');
        // Determine playMode for GameFlowOptions
        let flowPlayMode;
        if (gameInstance.playMode === 'quiz' || gameInstance.playMode === 'tournament') {
            flowPlayMode = gameInstance.playMode;
        }
        else {
            logger.warn({ playMode: gameInstance.playMode, gameInstanceId: gameInstance.id }, 'Unexpected playMode for game flow, defaulting to "tournament"');
            flowPlayMode = 'tournament'; // Default or handle error appropriately
        }
        logger.debug({ accessCode, socketId: socket.id, flowPlayMode }, '[DEBUG] Determined playMode for GameFlowOptions');
        // Update game state in Redis before DB update and redirect logic
        try {
            await gameStateService_1.default.updateGameState(accessCode, {
                gameId: gameInstance.id,
                accessCode,
                status: 'active', // Set to active so clients joining live room see it as active
                currentQuestionIndex: -1, // Indicate that countdown is happening before Q0
                questionUids: actualQuestions.map(q => q.uid),
                timer: {
                    status: 'pause', // Paused during countdown
                    timeLeftMs: 0,
                    durationMs: 0,
                    questionUid: null,
                    timestamp: Date.now(),
                    localTimeLeftMs: null
                },
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                }
            });
            logger.debug({ accessCode, gameInstanceId: gameInstance.id, socketId: socket.id }, '[TournamentHandler] Game state updated in Redis prior to starting flow.');
        }
        catch (error) {
            logger.error({ error, accessCode, socketId: socket.id }, '[TournamentHandler] Failed to update game state in Redis.');
            socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'Failed to initialize game state.' });
            return;
        }
        const gameFlowOptions = {
            playMode: flowPlayMode,
        };
        await gameInstanceService.updateGameStatus(gameInstance.id, { status: 'active', currentQuestionIndex: -1 }); // currentQuestionIndex to -1 for countdown phase
        const liveRoom = `game_${accessCode}`;
        const countdownDuration = 5; // 5 seconds
        logger.debug({ accessCode, gameInstanceId: gameInstance.id, socketId: socket.id }, '[DEBUG] Updated game status to active (countdown phase)');
        logger.info({ room: liveRoom, duration: countdownDuration, accessCode, socketId: socket.id }, `[TournamentHandler] Emitting tournament_starting and waiting ${countdownDuration}s before starting game.`);
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
        logger.debug({ accessCode, gameInstanceId: gameInstance.id, socketId: socket.id }, `[TournamentHandler] Countdown complete. About to start game flow.`);
        io.to(liveRoom).emit('countdown_complete'); // TODO: Define shared type if missing
        io.to(lobbyRoom).emit('countdown_complete'); // TODO: Define shared type if missing
        logger.debug({ accessCode, gameInstanceId: gameInstance.id, socketId: socket.id }, `[TournamentHandler] Countdown finished. Calling runGameFlow.`);
        // Update currentQuestionIndex to 0 before starting game flow
        // Also ensure other required fields for GameState are present or updated as necessary
        const currentStateData = await gameStateService_1.default.getFullGameState(accessCode); // Changed getGameState to getFullGameState
        if (!currentStateData || !currentStateData.gameState) { // Check for gameState property
            logger.error({ accessCode, socketId: socket.id }, '[TournamentHandler] CRITICAL: Game state not found or incomplete before final update for runGameFlow. Aborting.');
            // Potentially emit an error to the room or handle more gracefully
            return;
        }
        await gameStateService_1.default.updateGameState(accessCode, {
            ...currentStateData.gameState, // Spread existing gameState
            currentQuestionIndex: 0,
            status: 'active', // Ensure status is still active
            timer: {
                status: 'pause', // Will be started by game flow
                timeLeftMs: 0,
                durationMs: 0,
                questionUid: null,
                timestamp: Date.now(),
                localTimeLeftMs: null
            }
        });
        await gameInstanceService.updateGameStatus(gameInstance.id, {
            status: 'active', // Required by GameStatusUpdateData
            currentQuestionIndex: 0
        });
        (0, sharedGameFlow_1.runGameFlow)(io, accessCode, actualQuestions, gameFlowOptions);
        logger.debug({ accessCode, socketId: socket.id }, '[TournamentHandler] runGameFlow called for accessCode');
    });
}
exports.default = tournamentHandler;
