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
exports.projectionHandler = projectionHandler;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const gameStateService = __importStar(require("@/core/services/gameStateService"));
const gameAuthorization_1 = require("@/utils/gameAuthorization");
const leaderboardSnapshotService_1 = require("@/core/services/gameParticipant/leaderboardSnapshotService");
const logger = (0, logger_1.default)('ProjectionHandler');
/**
 * Handler for teacher projection page to join projection room
 * Separate from dashboard to keep rooms cleanly separated
 */
function projectionHandler(io, socket) {
    logger.info({ socketId: socket.id }, 'ProjectionHandler: Socket connected, setting up projection event listeners');
    /**
     * Join projection room for a specific gameId
     * This is specifically for the teacher projection page display
     */
    socket.on(events_1.SOCKET_EVENTS.PROJECTOR.JOIN_PROJECTION, async (payload) => {
        logger.info({ socketId: socket.id, payload }, 'ProjectionHandler: Received JOIN_PROJECTION event');
        try {
            const { gameId } = payload;
            if (!gameId || typeof gameId !== 'string') {
                const errorPayload = {
                    message: 'Invalid gameId for projection join',
                    code: 'VALIDATION_ERROR',
                    details: { gameId }
                };
                socket.emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, errorPayload);
                return;
            }
            // Get userId from socket.data (should be populated by auth middleware)
            let effectiveUserId = socket.data?.userId || socket.data?.user?.userId;
            // Debug authentication data
            logger.info({
                socketId: socket.id,
                socketData: socket.data,
                auth: socket.handshake.auth,
                headers: socket.handshake.headers
            }, 'Projection socket authentication data');
            if (!effectiveUserId) {
                logger.warn({ gameId, socketId: socket.id }, 'No userId on socket.data for projection');
                // Try to get userId from auth directly for testing purposes
                const testUserId = socket.handshake.auth.userId;
                if (testUserId && socket.handshake.auth.userType === 'teacher') {
                    logger.info({ testUserId }, 'Using userId from auth directly for testing (projection)');
                    // Set the userId on socket.data for future usage
                    socket.data.userId = testUserId;
                    socket.data.user = { userId: testUserId, role: 'TEACHER' };
                    effectiveUserId = testUserId;
                }
                else {
                    // No userId found anywhere, return error
                    const errorPayload = {
                        message: 'Authentication required to join projection',
                        code: 'AUTHENTICATION_REQUIRED',
                        details: { gameId }
                    };
                    socket.emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, errorPayload);
                    return;
                }
            }
            // Use shared authorization helper
            const isTestEnvironment = process.env.NODE_ENV === 'test' || socket.handshake.auth?.isTestUser;
            const authResult = await (0, gameAuthorization_1.validateGameAccess)({
                gameId,
                userId: effectiveUserId,
                isTestEnvironment,
                requireQuizMode: true
            }); // QUIZ ONLY
            if (!authResult.isAuthorized) {
                const errorPayload = {
                    message: authResult.errorMessage || 'Authorization failed',
                    code: authResult.errorCode || 'AUTHORIZATION_ERROR',
                    details: { gameId }
                };
                socket.emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, errorPayload);
                return;
            }
            const gameInstance = authResult.gameInstance;
            // Join the projection room
            const projectionRoom = `projection_${gameId}`;
            await socket.join(projectionRoom);
            logger.info({
                socketId: socket.id,
                gameId,
                projectionRoom,
                accessCode: gameInstance.accessCode
            }, 'Projection page joined projection room');
            // Send success confirmation
            socket.emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_JOINED, {
                gameId,
                accessCode: gameInstance.accessCode,
                room: projectionRoom
            });
            // Send initial game state to the projection
            const fullState = await gameStateService.getFullGameState(gameInstance.accessCode);
            if (!fullState) {
                logger.warn({ gameId }, 'No game state found for projection');
                return;
            }
            let enhancedGameState = fullState.gameState;
            // --- MODERNIZATION: Always include canonical current question in gameState.questionData and timer ---
            // Fetch all questions for this game instance (ordered)
            const gameInstanceWithQuestions = await prisma_1.prisma.gameInstance.findUnique({
                where: { id: gameId },
                include: {
                    gameTemplate: {
                        include: {
                            questions: {
                                include: {
                                    question: {
                                        include: {
                                            multipleChoiceQuestion: true,
                                            numericQuestion: true,
                                        }
                                    }
                                },
                                orderBy: { sequence: 'asc' }
                            }
                        }
                    }
                }
            });
            if (enhancedGameState && gameInstanceWithQuestions?.gameTemplate?.questions) {
                const questionsArr = gameInstanceWithQuestions.gameTemplate.questions;
                let questionIndex = typeof enhancedGameState.currentQuestionIndex === 'number' && enhancedGameState.currentQuestionIndex >= 0 && enhancedGameState.currentQuestionIndex < questionsArr.length
                    ? enhancedGameState.currentQuestionIndex
                    : -1;
                let currentQuestion = null;
                let currentQuestionUid = null;
                if (questionIndex !== -1) {
                    currentQuestion = questionsArr[questionIndex]?.question;
                    currentQuestionUid = currentQuestion?.uid;
                }
                if (currentQuestion) {
                    const { filterQuestionForClient } = await Promise.resolve().then(() => __importStar(require('@shared/types/quiz/liveQuestion')));
                    const filteredQuestion = filterQuestionForClient(currentQuestion);
                    enhancedGameState.questionData = filteredQuestion;
                }
                // --- MODERNIZATION: Always include canonical timer state for current question ---
                if (currentQuestionUid) {
                    const { getCanonicalTimer } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameStateService')));
                    // Use canonical timer system for projection
                    const canonicalTimer = await getCanonicalTimer(gameInstance.accessCode, currentQuestionUid, enhancedGameState.gameMode, enhancedGameState.status === 'completed', (currentQuestion?.timeLimit || 30) * 1000 // durationMs
                    );
                    if (canonicalTimer) {
                        enhancedGameState.timer = canonicalTimer;
                    }
                }
            }
            // Fetch the leaderboard snapshot (join-bonus-only) for projection
            const snapshot = await (0, leaderboardSnapshotService_1.getLeaderboardSnapshot)(gameInstance.accessCode);
            // --- MODERNIZATION: Validate outgoing projection_state payload with Zod ---
            const projectionPayload = {
                accessCode: gameInstance.accessCode,
                gameState: enhancedGameState,
                participants: fullState.participants,
                answers: fullState.answers,
                leaderboard: snapshot // Use snapshot, not full leaderboard
            };
            // DEBUG: Log the leaderboard being sent to projection
            logger.info({
                gameId,
                accessCode: gameInstance.accessCode,
                leaderboardCount: snapshot?.length || 0,
                leaderboard: snapshot?.map((entry) => ({
                    userId: entry.userId,
                    username: entry.username,
                    avatarEmoji: entry.avatarEmoji,
                    score: entry.score
                })) || []
            }, '🔍 [DEBUG-PROJECTION] Sending initial leaderboard to projection');
            // Detailed logging of the payload being sent
            logger.info({
                gameId,
                accessCode: gameInstance.accessCode,
                payloadKeys: Object.keys(projectionPayload),
                gameStateKeys: enhancedGameState ? Object.keys(enhancedGameState) : null,
                questionData: enhancedGameState?.questionData ? 'present' : 'missing',
                questionDataUid: enhancedGameState?.questionData?.uid,
                participantsCount: fullState?.participants?.length || 0,
                answersKeys: fullState?.answers ? Object.keys(fullState.answers) : null,
                leaderboardCount: fullState?.leaderboard?.length || 0
            }, 'Initial projection state payload details');
            // Zod validation for outgoing projection_state payload
            try {
                const { validateProjectionStatePayload } = await Promise.resolve().then(() => __importStar(require('./validateProjectionStateWithZod')));
                const validationResult = validateProjectionStatePayload(projectionPayload);
                if (!validationResult.success) {
                    logger.error({
                        gameId,
                        errors: validationResult.error?.errors,
                        projectionPayload
                    }, '[ZOD] Outgoing PROJECTION_STATE payload failed validation');
                }
            }
            catch (zodErr) {
                logger.error({ gameId, zodErr }, '[ZOD] Error running projection_state Zod validation');
            }
            socket.emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE, projectionPayload);
            logger.info({ gameId, accessCode: gameInstance.accessCode }, 'Initial projection state sent');
            // Send current projection display state if it exists
            const displayState = await gameStateService.getProjectionDisplayState(gameInstance.accessCode);
            if (displayState) {
                logger.info({
                    gameId,
                    accessCode: gameInstance.accessCode,
                    displayState
                }, 'Sending initial projection display state');
                // Always emit the full stats state for projection initialization
                socket.emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_STATS_STATE, {
                    showStats: displayState.showStats,
                    currentStats: displayState.currentStats,
                    statsQuestionUid: displayState.statsQuestionUid,
                    timestamp: Date.now()
                });
                logger.info({ gameId, showStats: displayState.showStats }, 'Sent initial PROJECTION_STATS_STATE');
                // If stats are currently shown, fetch latest stats for current question and emit
                if (displayState.showStats) {
                    // Fetch current question UID from canonical game state
                    const { getFullGameState } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameStateService')));
                    const { getAnswerStats } = await Promise.resolve().then(() => __importStar(require('./teacherControl/helpers')));
                    const fullState = await getFullGameState(gameInstance.accessCode);
                    const gameState = fullState?.gameState;
                    let currentQuestionUid = null;
                    if (gameState && typeof gameState.currentQuestionIndex === 'number' && Array.isArray(gameState.questionUids)) {
                        currentQuestionUid = gameState.questionUids[gameState.currentQuestionIndex] || null;
                    }
                    let answerStats = {};
                    if (currentQuestionUid) {
                        answerStats = await getAnswerStats(gameInstance.accessCode, currentQuestionUid);
                    }
                    // Emit canonical event with latest stats
                    socket.emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_SHOW_STATS, {
                        questionUid: currentQuestionUid,
                        show: true,
                        stats: answerStats,
                        timestamp: Date.now()
                    });
                    logger.info({ gameId, questionUid: currentQuestionUid }, 'Sent initial stats state (canonical, fresh stats)');
                    // Optionally update Redis display state for consistency
                    await gameStateService.updateProjectionDisplayState(gameInstance.accessCode, {
                        currentStats: answerStats,
                        statsQuestionUid: currentQuestionUid
                    });
                }
                // If correct answers are currently shown
                if (displayState.showCorrectAnswers && displayState.correctAnswersData) {
                    socket.emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_CORRECT_ANSWERS, {
                        ...displayState.correctAnswersData,
                        timestamp: Date.now()
                    });
                    logger.info({ gameId }, 'Sent initial correct answers state');
                }
            } // <-- This closes the try block for the JOIN_PROJECTION handler
        }
        catch (error) {
            logger.error({ error, payload }, 'Error joining projection room');
            const errorPayload = {
                message: 'Failed to join projection room',
                code: 'JOIN_ERROR',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
            socket.emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, errorPayload);
        }
    });
    /**
     * Leave projection room
     */
    socket.on(events_1.SOCKET_EVENTS.PROJECTOR.LEAVE_PROJECTION, async (payload) => {
        logger.info({ socketId: socket.id, payload }, 'ProjectionHandler: Received LEAVE_PROJECTION event');
        try {
            const { gameId } = payload;
            if (gameId && typeof gameId === 'string') {
                const projectionRoom = `projection_${gameId}`;
                await socket.leave(projectionRoom);
                logger.info({
                    socketId: socket.id,
                    gameId,
                    projectionRoom
                }, 'Projection page left projection room');
                socket.emit(events_1.SOCKET_EVENTS.PROJECTOR.PROJECTION_LEFT, { gameId, room: projectionRoom });
            }
        }
        catch (error) {
            logger.error({ error, payload }, 'Error leaving projection room');
        }
    });
}
