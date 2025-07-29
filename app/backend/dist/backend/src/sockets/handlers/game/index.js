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
exports.registerTournamentHandlers = void 0;
exports.registerGameHandlers = registerGameHandlers;
const joinGame_1 = require("./joinGame");
const gameAnswer_1 = require("./gameAnswer");
const requestParticipants_1 = require("./requestParticipants");
const disconnect_1 = require("./disconnect");
const requestNextQuestion_1 = require("./requestNextQuestion");
const events_1 = require("@shared/types/socket/events");
const logger_1 = __importDefault(require("@/utils/logger"));
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const toCanonicalTimer_1 = require("@/core/services/toCanonicalTimer");
const logger = (0, logger_1.default)('GameHandlers');
function registerGameHandlers(io, socket) {
    logger.info({ socketId: socket.id }, 'Registering game handlers');
    // Register direct handlers on socket instance using shared constants
    socket.on(events_1.GAME_EVENTS.JOIN_GAME, (0, joinGame_1.joinGameHandler)(io, socket));
    // Modernized GAME_ANSWER handler: resolve canonical context and pass to DRY handler
    socket.on(events_1.GAME_EVENTS.GAME_ANSWER, async (payload) => {
        console.log('[DEBUG] GAME_ANSWER handler triggered', { payload });
        // Extract accessCode, userId, questionUid from payload (validate with Zod if needed)
        let accessCode, userId, questionUid;
        try {
            // Use the same schema as in the handler for validation
            const { AnswerSubmissionPayloadSchema } = await Promise.resolve().then(() => __importStar(require('@shared/types/core/answer')));
            const parseResult = AnswerSubmissionPayloadSchema.safeParse(payload);
            if (!parseResult.success) {
                console.log('[DEBUG] Early return: invalid answer submission payload', { payload, error: parseResult.error });
                socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'Invalid answer submission payload.' });
                return;
            }
            accessCode = parseResult.data.accessCode;
            userId = parseResult.data.userId;
            questionUid = parseResult.data.questionUid;
        }
        catch (err) {
            console.log('[DEBUG] Early return: malformed answer submission', { payload, err });
            socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'Malformed answer submission.' });
            return;
        }
        // Canonical context resolution (no legacy/branching logic)
        const { CanonicalTimerService } = await Promise.resolve().then(() => __importStar(require('@/core/services/canonicalTimerService')));
        const { getFullGameState } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameStateService')));
        const { prisma } = await Promise.resolve().then(() => __importStar(require('@/db/prisma')));
        const timerService = new CanonicalTimerService((await Promise.resolve().then(() => __importStar(require('@/config/redis')))).redisClient);
        // Fetch gameInstance
        const gameInstance = await prisma.gameInstance.findUnique({ where: { accessCode } });
        if (!gameInstance) {
            console.log('[DEBUG] Early return: gameInstance not found', { accessCode });
            socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'Game instance not found.' });
            return;
        }
        // Fetch participant (by gameInstanceId, userId) - unified participant model
        let participant;
        // With the new schema, there's only one participant per user/game
        participant = await prisma.gameParticipant.findFirst({
            where: { gameInstanceId: gameInstance.id, userId },
            include: { user: true }
        });
        if (!participant) {
            // Defensive: Try to create participant row if missing
            console.log('[DEBUG] Participant not found, attempting to create', { accessCode, userId });
            const { joinGame: joinGameModular } = await Promise.resolve().then(() => __importStar(require('@/core/services/gameParticipant/joinService')));
            let username = payload?.username || `guest-${userId?.substring(0, 8)}`;
            let avatarEmoji = payload?.avatarEmoji || null;
            const joinResult = await joinGameModular({ userId, accessCode, username, avatarEmoji });
            if (!joinResult.success || !joinResult.participant) {
                console.log('[DEBUG] Early return: participant creation failed', { accessCode, userId, error: joinResult.error });
                socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'Could not create participant.' });
                return;
            }
            participant = joinResult.participant;
        }
        // Fetch game state (by correct session key)
        // Canonical deferred detection: status === 'completed' and within deferred window
        const now = Date.now();
        const deferredWindowOpen = gameInstance.differedAvailableFrom && gameInstance.differedAvailableTo &&
            now >= new Date(gameInstance.differedAvailableFrom).getTime() &&
            now <= new Date(gameInstance.differedAvailableTo).getTime();
        let isDeferred = false;
        let contextGameInstance = gameInstance;
        if (gameInstance.playMode === 'tournament' && gameInstance.status === 'completed' && deferredWindowOpen) {
            // For deferred tournaments, we use the same gameInstance but track isDeferred separately
            isDeferred = true;
        }
        // Always use per-user session key and timer for deferred
        let sessionKey;
        let attemptCount = 1;
        if (isDeferred || (gameInstance.playMode === 'tournament' && gameInstance.status === 'completed')) {
            // Use socket-stored attemptCount if present (set at session start), else fetch from DB
            if (socket.data.deferredAttemptCount) {
                attemptCount = socket.data.deferredAttemptCount;
            }
            else {
                attemptCount = participant?.nbAttempts || 1;
                // Store for this socket/session
                socket.data.deferredAttemptCount = attemptCount;
            }
            sessionKey = `deferred_session:${accessCode}:${userId}:${attemptCount}`;
            // Log the attemptCount and sessionKey for deferred answer submission
            console.log('[DEBUG][DEFERRED_ANSWER_ATTEMPT]', { accessCode, userId, attemptCount, sessionKey, questionUid });
        }
        else {
            sessionKey = accessCode;
        }
        const gameState = await getFullGameState(sessionKey);
        // Diagnostic: Always log sessionKey and gameState after fetching, before any returns
        console.log('[DEBUG] Loaded gameState for answer submission', { accessCode, userId, sessionKey, gameState, gameInstance });
        if (!gameState) {
            // Defensive: if in deferred mode and gameState is missing, clear socket-stored attemptCount to allow recovery on next attempt
            if (isDeferred && socket.data.deferredAttemptCount) {
                delete socket.data.deferredAttemptCount;
            }
            console.log('[DEBUG] Early return: gameState not found', { sessionKey });
            socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'Game state not found.' });
            return;
        }
        // Always canonicalize timer before passing to answer handler
        // durationMs: get from question (if available), else fallback to 30s
        let durationMs = 0;
        if (gameState && gameState.gameState && Array.isArray(gameState.gameState.questionUids)) {
            const idx = gameState.gameState.questionUids.findIndex((uid) => uid === questionUid);
            if (idx !== -1 && Array.isArray(gameState.gameState.questionUids)) {
                // Try to get timeLimit from DB for this questionUid
                const questionUidToFetch = gameState.gameState.questionUids[idx];
                try {
                    const question = await prisma.question.findUnique({ where: { uid: questionUidToFetch } });
                    if (question && typeof question.timeLimit === 'number')
                        durationMs = question.timeLimit * 1000;
                }
                catch (err) {
                    // fallback below
                }
            }
        }
        if (!durationMs)
            durationMs = 0; // no fallback allowed
        // Debug: log timer fetch context
        console.log('[DEBUG][TIMER_FETCH] Fetching timer for answer', {
            accessCode,
            questionUid,
            playMode: gameInstance.playMode,
            isDeferred,
            userId,
            attemptCount,
            logPoint: 'DEFERRED_ANSWER_TIMER_FETCH'
        });
        // Fetch timer (canonical: always resolve here, never in handler)
        let timer = null;
        let canonicalTimer = null;
        if (gameInstance.playMode === 'practice') {
            timer = null;
            canonicalTimer = null;
        }
        else if (isDeferred || (gameInstance.playMode === 'tournament' && gameInstance.status === 'completed')) {
            timer = await timerService.getTimer(accessCode, questionUid, gameInstance.playMode, true, userId, attemptCount, durationMs);
        }
        else {
            timer = await timerService.getTimer(accessCode, questionUid, gameInstance.playMode, false, undefined, undefined, durationMs);
        }
        console.log('[DEBUG][TIMER_FETCH] Raw timer loaded:', timer);
        canonicalTimer = (0, toCanonicalTimer_1.toCanonicalTimer)(timer, durationMs);
        console.log('[DEBUG][TIMER_FETCH] Canonical timer:', canonicalTimer);
        const context = { timer: canonicalTimer, gameState, participant, gameInstance: contextGameInstance };
        // Call the DRY handler
        return (0, gameAnswer_1.gameAnswerHandler)(io, socket, context)(payload);
    });
    socket.on(events_1.GAME_EVENTS.REQUEST_PARTICIPANTS, (0, requestParticipants_1.requestParticipantsHandler)(io, socket));
    socket.on(events_1.GAME_EVENTS.REQUEST_NEXT_QUESTION, (0, requestNextQuestion_1.requestNextQuestionHandler)(io, socket));
    socket.on('disconnect', (0, disconnect_1.disconnectHandler)(io, socket));
    // Direct handler for start_game in practice mode
    socket.on(events_1.GAME_EVENTS.START_GAME, async (payload) => {
        // Runtime validation with Zod
        const parseResult = socketEvents_zod_1.startGamePayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid startGame payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');
            const errorPayload = {
                message: 'Invalid startGame payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };
            socket.emit(events_1.GAME_EVENTS.GAME_ERROR, errorPayload);
            return;
        }
        const { accessCode, userId } = parseResult.data;
        logger.info({ socketId: socket.id, accessCode, userId }, 'Start game event received');
        try {
            const prismaInstance = (await Promise.resolve().then(() => __importStar(require('@/db/prisma')))).prisma;
            const gameInstance = await prismaInstance.gameInstance.findUnique({
                where: { accessCode },
                include: {
                    gameTemplate: {
                        include: {
                            questions: {
                                include: { question: true },
                                orderBy: { sequence: 'asc' }
                            }
                        }
                    }
                }
            });
            if (!gameInstance || !gameInstance.gameTemplate) {
                logger.warn({ socketId: socket.id, accessCode }, 'Game instance or template not found');
                socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'Game not found or template missing.' });
                return;
            }
            if (gameInstance.playMode !== 'practice') {
                logger.warn({ socketId: socket.id, playMode: gameInstance.playMode }, 'start_game is only for practice mode');
                socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'start_game only allowed in practice mode.' });
                return;
            }
            // Update game status
            await prismaInstance.gameInstance.update({
                where: { id: gameInstance.id },
                data: { status: 'active', startedAt: new Date() }
            });
            // Check if we have questions
            if (gameInstance.gameTemplate.questions.length === 0) {
                logger.warn({ socketId: socket.id, accessCode }, 'No questions in template');
                socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'No questions available in this game.' });
                return;
            }
            // Get first question
            const firstQuestionInTemplate = gameInstance.gameTemplate.questions[0];
            const firstQuestion = firstQuestionInTemplate.question;
            // Send first question
            logger.info({ socketId: socket.id, questionUid: firstQuestion.uid }, 'Sending first question');
            // ⚠️ SECURITY: Filter question to remove sensitive data (correctAnswers, explanation, etc.)
            const { filterQuestionForClient } = await Promise.resolve().then(() => __importStar(require('@/../../shared/types/quiz/liveQuestion')));
            const filteredQuestion = filterQuestionForClient(firstQuestion);
            // Send first question data using filtered question
            // Modernized: Canonical, flat payload for game_question
            const { questionDataSchema } = await Promise.resolve().then(() => __importStar(require('@/../../shared/types/socketEvents.zod')));
            let canonicalPayload = {
                ...filteredQuestion,
                currentQuestionIndex: 0,
                totalQuestions: gameInstance.gameTemplate.questions.length
            };
            // Remove timeLimit if null or undefined (schema expects it omitted, not null)
            if (canonicalPayload.timeLimit == null) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { timeLimit, ...rest } = canonicalPayload;
                canonicalPayload = rest;
            }
            const parseResult = questionDataSchema.safeParse(canonicalPayload);
            if (!parseResult.success) {
                logger.error({ errors: parseResult.error.errors, canonicalPayload }, '[MODERNIZATION] Invalid GAME_QUESTION payload, not emitting');
            }
            else {
                socket.emit(events_1.GAME_EVENTS.GAME_QUESTION, canonicalPayload);
                logger.info({ socketId: socket.id, questionUid: firstQuestion.uid, canonicalPayload }, '[MODERNIZATION] Emitted canonical GAME_QUESTION to user');
            }
        }
        catch (err) {
            logger.error({ socketId: socket.id, error: err }, 'Error in start_game handler');
            socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'Failed to start game: ' + err.message });
        }
    });
}
var index_1 = require("../tournament/index");
Object.defineProperty(exports, "registerTournamentHandlers", { enumerable: true, get: function () { return index_1.registerTournamentHandlers; } });
