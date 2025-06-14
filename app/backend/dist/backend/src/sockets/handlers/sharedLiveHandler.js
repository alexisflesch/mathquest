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
const sharedLeaderboard_1 = require("./sharedLeaderboard");
const sharedAnswers_1 = require("./sharedAnswers");
const sharedScore_1 = require("./sharedScore");
const logger_1 = __importDefault(require("@/utils/logger"));
const gameStateService_1 = require("@/core/gameStateService");
const redis_1 = require("@/config/redis");
const events_1 = require("@shared/types/socket/events");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const logger = (0, logger_1.default)('SharedLiveHandler');
function registerSharedLiveHandlers(io, socket) {
    const joinHandler = async (payload) => {
        // Runtime validation with Zod
        const parseResult = socketEvents_zod_1.sharedJoinPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid join payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');
            const errorPayload = {
                message: 'Invalid join payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };
            socket.emit('game_error', errorPayload);
            return;
        }
        const { accessCode, userId, username, avatarEmoji } = parseResult.data;
        let { playMode } = parseResult.data;
        // Determine playMode if not provided
        if (!playMode) {
            try {
                const prisma = await Promise.resolve().then(() => __importStar(require('@/db/prisma'))).then(m => m.prisma);
                const gameInstance = await prisma.gameInstance.findUnique({
                    where: { accessCode },
                    select: { playMode: true }
                });
                if (gameInstance && gameInstance.playMode) {
                    playMode = gameInstance.playMode;
                    logger.info({ accessCode, userId, determinedPlayMode: playMode }, 'Determined playMode from game instance');
                }
                else {
                    logger.warn({ accessCode, userId }, 'Could not determine playMode from game instance, defaulting to quiz');
                    playMode = 'quiz'; // Default playMode
                }
            }
            catch (error) {
                logger.error({ accessCode, userId, error }, 'Error fetching game instance to determine playMode, defaulting to quiz');
                playMode = 'quiz'; // Default playMode on error
            }
        }
        const room = `game_${accessCode}`;
        const participantUsername = typeof username === 'string' ? username : 'Anonymous';
        const participantAvatarEmoji = typeof avatarEmoji === 'string' ? avatarEmoji : undefined;
        // Populate socket.data for disconnectHandler and other potential uses
        socket.data.userId = userId;
        socket.data.accessCode = accessCode;
        socket.data.username = participantUsername;
        socket.data.currentGameRoom = room;
        logger.info({ accessCode, userId, room, playMode, username: participantUsername, avatarEmoji: participantAvatarEmoji }, '[DEBUG] Attempting to join room');
        await socket.join(room); // Use await for join
        logger.info({ accessCode, userId, room, playMode }, '[DEBUG] Joined room');
        const gameStateRaw = await (0, gameStateService_1.getFullGameState)(accessCode);
        // Create participant data for the GameJoinedPayload
        const participantData = {
            id: socket.id, // Use socket ID as participant ID for now
            userId: userId,
            username: participantUsername,
            avatar: participantAvatarEmoji || '�', // Default to panda avatar if none provided
            score: 0, // Initial score
            socketId: socket.id,
            online: true,
            joinedAt: new Date().toISOString(),
            isDeferred: false, // TODO: Determine from game instance data
            avatarEmoji: participantAvatarEmoji || '🐼' // For backward compatibility
        };
        // Create the correct GameJoinedPayload structure
        let gameJoinedPayload = {
            accessCode: accessCode,
            participant: participantData,
            gameStatus: 'pending', // Default to pending
            isDiffered: false // TODO: Determine from game instance data
        };
        // Update gameStatus based on game state
        if (gameStateRaw && gameStateRaw.gameState) {
            const gs = gameStateRaw.gameState;
            // Map internal status to the expected gameStatus values
            if (gs.status === 'active') {
                gameJoinedPayload.gameStatus = 'active';
            }
            else if (gs.status === 'completed') {
                gameJoinedPayload.gameStatus = 'completed';
            }
            else if (gs.status === 'paused') {
                // Map paused to active since paused is still an active game
                gameJoinedPayload.gameStatus = 'active';
            }
            else {
                gameJoinedPayload.gameStatus = 'pending';
            }
            // Send current question and timer state separately if game is active
            if (gs.currentQuestionIndex >= 0 && gs.currentQuestionIndex < gs.questionUids.length) {
                const prisma = await Promise.resolve().then(() => __importStar(require('@/db/prisma'))).then(m => m.prisma);
                const questionUid = gs.questionUids[gs.currentQuestionIndex];
                const question = await prisma.question.findUnique({ where: { uid: questionUid } });
                if (question) {
                    const patchedQuestion = {
                        ...question,
                        defaultMode: question.questionType || 'single_correct',
                        answers: Array.isArray(question.answerOptions)
                            ? question.answerOptions.map((text, idx) => ({
                                text,
                                correct: Array.isArray(question.correctAnswers) ? !!question.correctAnswers[idx] : false
                            }))
                            : [],
                        difficulty: question.difficulty === null ? undefined : question.difficulty,
                        gradeLevel: question.gradeLevel === null ? undefined : question.gradeLevel,
                        title: question.title === null ? undefined : question.title,
                        explanation: question.explanation === null ? undefined : question.explanation,
                    };
                    const { filterQuestionForClient } = await Promise.resolve().then(() => __importStar(require('@/../../shared/types/quiz/liveQuestion')));
                    const filteredQuestion = filterQuestionForClient(patchedQuestion);
                    // Send the question as a separate event
                    socket.emit('game_question', {
                        question: filteredQuestion,
                        questionIndex: gs.currentQuestionIndex,
                        totalQuestions: gs.questionUids.length
                    });
                    // Send timer state as a separate event
                    if (gs.timer) {
                        // With shared GameTimerState, timeLeftMs is already calculated and available
                        const timeLeftMs = gs.timer.timeLeftMs || 0;
                        // When emitting game_timer_updated, use the correct structure:
                        socket.emit('game_timer_updated', {
                            timer: {
                                isPaused: gs.timer.status === 'pause',
                                timeLeftMs: gs.timer.timeLeftMs,
                                startedAt: gs.timer.timestamp,
                                durationMs: gs.timer.durationMs
                            },
                            questionUid: questionUid
                        });
                    }
                    // Handle feedback and correct answers timing
                    let shouldSendCorrectAnswers = false;
                    let shouldSendFeedback = false;
                    let feedbackRemaining = 0;
                    if (gs.timer && gs.timer.durationMs) {
                        const timeLeftMs = gs.timer.timeLeftMs || 0;
                        if (timeLeftMs <= 0) {
                            shouldSendCorrectAnswers = true;
                            if (patchedQuestion.feedbackWaitTime && patchedQuestion.feedbackWaitTime > 0) {
                                // For feedback timing, we need to track when feedback phase started
                                // Since shared timer doesn't have startedAt, we'll use timestamp if available
                                const now = Date.now();
                                const feedbackDurationMs = patchedQuestion.feedbackWaitTime * 1000;
                                // Simplified: assume feedback just started if timer expired
                                shouldSendFeedback = true;
                                feedbackRemaining = Math.ceil(feedbackDurationMs / 1000);
                            }
                        }
                    }
                    if (shouldSendCorrectAnswers) {
                        socket.emit('correct_answers', {
                            questionUid,
                            correctAnswers: question.correctAnswers || []
                        }); // TODO: Define shared type if missing
                    }
                    if (shouldSendFeedback) {
                        const safeFeedbackRemaining = Number.isFinite(feedbackRemaining) ? Math.max(0, Math.ceil(feedbackRemaining)) : 0;
                        socket.emit('feedback', { questionUid: questionUid, feedbackRemaining: safeFeedbackRemaining }); // TODO: Define shared type if missing
                    }
                }
            }
        }
        socket.emit('game_joined', gameJoinedPayload);
        logger.info({ accessCode, userId, room, playMode, gameJoinedPayload }, '[DEBUG] Emitted game_joined with correct payload structure');
        // const participantUsername = typeof username === 'string' ? username : 'Anonymous'; // Moved up
        // const participantavatarEmoji = typeof avatarEmoji === 'string' ? avatarEmoji : undefined; // Moved up
        io.to(room).emit('participant_joined', { userId, username: participantUsername, avatarEmoji: participantAvatarEmoji, playMode });
        try {
            // Redis keys
            const participantsKey = `mathquest:game:participants:${accessCode}`;
            const userIdToSocketIdKey = `mathquest:game:userIdToSocketId:${accessCode}`;
            const socketIdToUserIdKey = `mathquest:game:socketIdToUserId:${accessCode}`;
            logger.debug({ userIdToSocketIdKey, userId, socketId: socket.id }, 'Updating userIdToSocketId mapping in sharedLiveHandler');
            await redis_1.redisClient.hset(userIdToSocketIdKey, userId, socket.id);
            logger.debug({ socketIdToUserIdKey, socketId: socket.id, userId }, 'Updating socketIdToUserId mapping in sharedLiveHandler');
            await redis_1.redisClient.hset(socketIdToUserIdKey, socket.id, userId);
            const participantDataForRedis = {
                userId,
                username: participantUsername,
                avatarEmoji: participantAvatarEmoji,
                score: 0, // Initial score, can be updated by answers
                answers: [], // For tracking answers within the live session
                online: true,
                lastSocketId: socket.id,
                joinedAt: new Date().toISOString()
            };
            logger.debug({ participantsKey, userId, participantDataForRedis }, 'Storing participant in Redis by userId in sharedLiveHandler');
            await redis_1.redisClient.hset(participantsKey, userId, // Use userId as the key
            JSON.stringify(participantDataForRedis));
        }
        catch (err) {
            logger.error({ err, accessCode, userId }, 'Failed to add participant to Redis in sharedLiveHandler');
        }
        logger.info({ accessCode, userId, playMode }, 'Participant joined live room via sharedLiveHandler');
    };
    const answerHandler = async (payload) => {
        // Runtime validation with Zod
        const parseResult = socketEvents_zod_1.sharedAnswerPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid answer payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');
            const errorPayload = {
                message: 'Invalid answer payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };
            socket.emit('answer_feedback', {
                status: 'error',
                code: 'VALIDATION_ERROR',
                message: 'Format de réponse invalide.'
            });
            return;
        }
        const { accessCode, userId, questionUid, answer, timeSpent } = parseResult.data;
        let { playMode } = parseResult.data;
        logger.info({ accessCode, userId, questionUid, answer, timeSpent, receivedPlayMode: playMode, socketId: socket.id }, '[SHARED_LIVE_HANDLER] game_answer received');
        if (!playMode) {
            try {
                const prisma = await Promise.resolve().then(() => __importStar(require('@/db/prisma'))).then(m => m.prisma);
                const gameInstance = await prisma.gameInstance.findUnique({
                    where: { accessCode },
                    select: { playMode: true, status: true }
                });
                if (gameInstance && gameInstance.playMode) {
                    playMode = gameInstance.playMode;
                    logger.info({ accessCode, userId, determinedPlayMode: playMode, gameStatus: gameInstance.status }, 'Determined playMode from game instance for answer');
                    if (playMode === 'practice') {
                        logger.info({ accessCode, userId, playMode }, 'Practice mode answer, bypassing sharedLiveHandler logic. GameAnswer.ts should handle.');
                        return;
                    }
                }
                else {
                    logger.warn({ accessCode, userId }, 'Could not determine playMode from game instance for answer, defaulting to quiz');
                    playMode = 'quiz';
                }
            }
            catch (error) {
                logger.error({ accessCode, userId, error }, 'Error fetching game instance to determine playMode for answer, defaulting to quiz');
                playMode = 'quiz';
            }
        }
        logger.info({ accessCode, userId, questionUid, answer, timeSpent, finalPlayMode: playMode, socketId: socket.id }, '[SHARED_LIVE_HANDLER] Processing game_answer with playMode');
        const currentPlayMode = playMode || 'quiz';
        const room = `game_${accessCode}`;
        const fullGameState = await (0, gameStateService_1.getFullGameState)(accessCode);
        if (!fullGameState || !fullGameState.gameState) {
            logger.warn({ accessCode, userId, questionUid }, 'Game state not found for answer validation.');
            socket.emit('answer_feedback', {
                status: 'error',
                code: 'GAME_NOT_FOUND',
                message: 'Jeu non trouvé. Impossible de soumettre la réponse.'
            });
            return;
        }
        const { gameState } = fullGameState;
        if (gameState.status !== 'active') {
            logger.warn({ accessCode, userId, questionUid, gameStatus: gameState.status, playMode: currentPlayMode }, 'Answer submitted but game is not active.');
            socket.emit('answer_feedback', {
                status: 'error',
                code: 'GAME_NOT_ACTIVE',
                message: 'Le jeu n\'est pas actif ou est terminé.'
            });
            return;
        }
        if (gameState.answersLocked) {
            logger.warn({ accessCode, userId, questionUid }, 'Answers are locked. Submission rejected.');
            socket.emit('answer_feedback', {
                status: 'error',
                code: 'ANSWERS_LOCKED',
                message: 'Les réponses sont verrouillées pour cette question.'
            });
            return;
        }
        // Check if timer has expired for this question (tournament mode)
        if (currentPlayMode === 'tournament') {
            const timerObj = gameState.timer;
            if (timerObj && timerObj.durationMs) {
                const timeLeftMs = timerObj.timeLeftMs || 0;
                if (timeLeftMs <= 0) {
                    logger.warn({ accessCode, userId, questionUid }, 'Answer submitted after timer expired (tournament mode).');
                    socket.emit('answer_feedback', {
                        status: 'error',
                        code: 'TIME_EXPIRED',
                        message: 'Le temps est écoulé pour cette question.'
                    });
                    return;
                }
            }
        }
        if (!gameState.questionUids || gameState.currentQuestionIndex === undefined || questionUid !== gameState.questionUids[gameState.currentQuestionIndex]) {
            logger.warn({ accessCode, userId, questionUid, currentQId: gameState.questionUids ? gameState.questionUids[gameState.currentQuestionIndex] : 'N/A' }, 'Answer submitted for wrong question.');
            socket.emit('answer_feedback', {
                status: 'error',
                code: 'WRONG_QUESTION',
                message: 'Réponse soumise pour une question incorrecte ou non active.'
            });
            return;
        }
        try {
            const participantKey = `mathquest:game:participants:${accessCode}`;
            const participantJson = await redis_1.redisClient.hget(participantKey, userId);
            let participantData;
            if (participantJson) {
                participantData = JSON.parse(participantJson);
                // Ensure answers array exists
                if (!participantData.answers) {
                    participantData.answers = [];
                }
            }
            else {
                logger.warn({ accessCode, userId }, "Participant not found in Redis for answer submission. Creating entry.");
                participantData = { userId, username: 'Unknown (from answer)', score: 0, answers: [] };
            }
            const existingAnswer = participantData.answers.find((a) => a.questionUid === questionUid);
            if (existingAnswer) {
                logger.info({ accessCode, userId, questionUid }, 'Participant already answered this question. Updating answer.');
                existingAnswer.answer = answer;
                existingAnswer.timeSpent = timeSpent;
            }
            else {
                participantData.answers.push({ questionUid, answer, timeSpent });
            }
            await redis_1.redisClient.hset(participantKey, userId, JSON.stringify(participantData));
            // Fetch question details to pass to calculateScore
            const prisma = await Promise.resolve().then(() => __importStar(require('@/db/prisma'))).then(m => m.prisma);
            const question = await prisma.question.findUnique({ where: { uid: questionUid } });
            if (!question) {
                logger.error({ accessCode, userId, questionUid }, "Question not found for scoring");
                socket.emit('answer_feedback', {
                    status: 'error',
                    code: 'QUESTION_NOT_FOUND',
                    message: 'Question non trouvée pour le calcul du score.'
                });
                return;
            }
            // Determine if the answer is correct
            // This is a simplified check, adapt as per your actual answer structure and correctness logic
            let isCorrect = false;
            if (question.correctAnswers && Array.isArray(question.correctAnswers)) {
                // Example for multiple choice where answer is an index or array of indices
                if (Array.isArray(answer)) { // multiple answers possible
                    isCorrect = JSON.stringify(answer.sort()) === JSON.stringify(question.correctAnswers.map((_, idx) => question.correctAnswers[idx] ? idx : null).filter(x => x !== null).sort());
                }
                else { // single answer (index)
                    if (typeof answer === 'number' && answer >= 0 && answer < question.correctAnswers.length) {
                        isCorrect = question.correctAnswers[answer] === true;
                    }
                }
            }
            else if (question.correctAnswers) { // single correct answer not in an array
                isCorrect = question.correctAnswers === answer;
            }
            const answerForScoring = {
                isCorrect,
                timeSpent, // timeSpent from payload
                // Add any other properties 'calculateScore' might need from the 'answer' payload
                value: answer
            };
            const score = (0, sharedScore_1.calculateScore)(answerForScoring, question); // Corrected call
            participantData.score = (participantData.score || 0) + score;
            await redis_1.redisClient.hset(participantKey, userId, JSON.stringify(participantData));
            await redis_1.redisClient.zadd(`mathquest:game:leaderboard:${accessCode}`, 'INCR', score, userId);
            socket.emit('answer_feedback', { status: 'ok', questionUid, scoreAwarded: score });
            logger.info({ accessCode, userId, questionUid, scoreAwarded: score }, 'Answer processed, feedback sent');
            if (currentPlayMode === 'quiz') {
                const collected = await (0, sharedAnswers_1.collectAnswers)(accessCode, questionUid);
                io.to(`teacher_control_${gameState.gameId}`).emit('quiz_answer_update', collected);
            }
            const leaderboard = await (0, sharedLeaderboard_1.calculateLeaderboard)(accessCode);
            io.to(room).emit('leaderboard_update', { leaderboard });
        }
        catch (error) {
            logger.error({ accessCode: payload.accessCode, userId: payload.userId, questionUid: payload.questionUid, error: error.message, stack: error.stack }, 'Error processing answer in sharedLiveHandler');
            socket.emit('answer_feedback', {
                status: 'error',
                code: 'PROCESSING_ERROR',
                message: 'Erreur lors du traitement de la réponse.'
            });
        }
    };
    socket.on(events_1.GAME_EVENTS.REQUEST_PARTICIPANTS, async (payload) => {
        // Runtime validation with Zod
        const parseResult = socketEvents_zod_1.requestParticipantsPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid requestParticipants payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');
            socket.emit(events_1.GAME_EVENTS.GAME_PARTICIPANTS, { participants: [] });
            return;
        }
        const { accessCode } = parseResult.data;
        try {
            const participants = await redis_1.redisClient.hvals(`mathquest:game:participants:${accessCode}`);
            socket.emit(events_1.GAME_EVENTS.GAME_PARTICIPANTS, { participants: participants.map(p => JSON.parse(p)) });
        }
        catch (error) {
            logger.error({ accessCode, error }, 'Error fetching participants');
            socket.emit(events_1.GAME_EVENTS.GAME_PARTICIPANTS, { participants: [] });
        }
    });
    socket.on(events_1.GAME_EVENTS.JOIN_GAME, (payload) => joinHandler(payload));
    socket.on(events_1.TOURNAMENT_EVENTS.JOIN_TOURNAMENT, (payload) => joinHandler({ ...payload, playMode: 'tournament' }));
    // Ensure game_answer is handled by answerHandler if not practice mode
    // For practice mode, gameAnswer.ts (registered in game/index.ts) should take precedence.
    socket.on(events_1.GAME_EVENTS.GAME_ANSWER, (payload) => {
        // This registration will be called if gameAnswer.ts doesn't stop propagation or if it's not practice.
        // The logic inside answerHandler now checks for playMode === 'practice' and returns early.
        answerHandler(payload);
    });
    socket.on(events_1.TOURNAMENT_EVENTS.TOURNAMENT_ANSWER, (payload) => answerHandler({ ...payload, playMode: 'tournament' }));
}
