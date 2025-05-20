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
const gameStateService_1 = require("@/core/gameStateService"); // Ensure GameState is imported
const logger = (0, logger_1.default)('SharedLiveHandler');
function registerSharedLiveHandlers(io, socket) {
    // Join event for both quiz and tournament
    const joinHandler = async (payload) => {
        const { accessCode, userId, username, avatarUrl, playMode } = payload;
        const room = `live_${accessCode}`;
        logger.info({ accessCode, userId, room, playMode, username, avatarUrl }, '[DEBUG] Attempting to join room');
        socket.join(room);
        logger.info({ accessCode, userId, room, playMode }, '[DEBUG] Joined room');
        // Fetch game state for game_joined event
        const gameStateRaw = await Promise.resolve().then(() => __importStar(require('@/core/gameStateService'))).then(m => m.getFullGameState(accessCode));
        let gameJoinPayload = {};
        if (gameStateRaw && gameStateRaw.gameState) {
            const gs = gameStateRaw.gameState;
            gameJoinPayload = {
                gameId: gs.gameId,
                accessCode: gs.accessCode,
                status: gs.status,
                currentQuestionIndex: gs.currentQuestionIndex,
                totalQuestions: gs.questionIds.length,
                timer: gs.timer || null,
                question: null
            };
            // If a question is active, include it
            if (gs.currentQuestionIndex >= 0 && gs.currentQuestionIndex < gs.questionIds.length) {
                const prisma = await Promise.resolve().then(() => __importStar(require('@/db/prisma'))).then(m => m.prisma);
                const questionId = gs.questionIds[gs.currentQuestionIndex];
                const question = await prisma.question.findUnique({ where: { uid: questionId } });
                if (question) {
                    // Patch Prisma question to match shared Question type
                    const patchedQuestion = {
                        ...question,
                        type: question.questionType || 'single_correct',
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
                    gameJoinPayload.question = filterQuestionForClient(patchedQuestion);
                    // --- Late joiner logic for correct_answers and feedback ---
                    // Determine if correct answers or feedback should be sent
                    let shouldSendCorrectAnswers = false;
                    let shouldSendFeedback = false;
                    let feedbackRemaining = 0;
                    // If timer is stopped or expired, send correct_answers
                    if (gs.timer && typeof gs.timer.startedAt === 'number' && typeof gs.timer.duration === 'number') {
                        const now = Date.now();
                        const elapsed = now - gs.timer.startedAt;
                        const remaining = Math.max(0, gs.timer.duration - elapsed);
                        if (remaining <= 0) {
                            shouldSendCorrectAnswers = true;
                            // If in feedback phase, also send feedback
                            if (patchedQuestion.feedbackWaitTime && patchedQuestion.feedbackWaitTime > 0) {
                                const feedbackStart = gs.timer.startedAt + gs.timer.duration;
                                const feedbackEnd = feedbackStart + patchedQuestion.feedbackWaitTime * 1000;
                                if (now < feedbackEnd) {
                                    shouldSendFeedback = true;
                                    feedbackRemaining = Math.ceil((feedbackEnd - now) / 1000);
                                }
                            }
                        }
                    }
                    if (shouldSendCorrectAnswers) {
                        socket.emit('correct_answers', { questionId });
                    }
                    if (shouldSendFeedback) {
                        socket.emit('feedback', { questionId, feedbackRemaining });
                    }
                }
            }
        }
        else {
            gameJoinPayload = {
                gameId: '',
                accessCode,
                status: 'pending',
                currentQuestionIndex: -1,
                totalQuestions: 0,
                timer: null,
                question: null
            };
        }
        // Always include timer value (countdown or question)
        socket.emit('game_joined', gameJoinPayload);
        logger.info({ accessCode, userId, room, playMode, gameJoinPayload }, '[DEBUG] Emitted game_joined with timer and state');
        // Ensure username is a string, default if not provided
        const participantUsername = typeof username === 'string' ? username : 'Anonymous';
        // Ensure avatarUrl is a string or undefined
        const participantAvatarUrl = typeof avatarUrl === 'string' ? avatarUrl : undefined;
        io.to(room).emit('participant_joined', { userId, username: participantUsername, avatarUrl: participantAvatarUrl, playMode });
        // Add participant to Redis participants hash (by userId and socket.id for resilience)
        try {
            const redis = await Promise.resolve().then(() => __importStar(require('@/config/redis'))).then(m => m.redisClient);
            // Map userId to socket.id for personalized emission
            await redis.hset(`mathquest:game:userIdToSocketId:${accessCode}`, payload.userId, socket.id);
            // Map socket.id to userId for disconnect cleanup
            await redis.hset(`mathquest:game:socketIdToUserId:${accessCode}`, socket.id, payload.userId);
            // Ensure participant data is robustly created
            const initialParticipantData = {
                userId,
                username: participantUsername,
                avatarUrl: participantAvatarUrl,
                score: 0, // Explicitly initialize score
                answers: [] // Explicitly initialize answers array
            };
            await redis.hset(`mathquest:game:participants:${accessCode}`, payload.userId, JSON.stringify(initialParticipantData));
        }
        catch (err) {
            logger.error({ err, accessCode, userId }, 'Failed to add participant to Redis');
        }
        logger.info({ accessCode, userId, playMode }, 'Participant joined live room');
        // Late joiner: emit current question if game is active and a question is in progress
        if (gameStateRaw && gameStateRaw.gameState && typeof gameStateRaw.gameState.currentQuestionIndex === 'number' && gameStateRaw.gameState.currentQuestionIndex >= 0) {
            const currentIndex = gameStateRaw.gameState.currentQuestionIndex;
            const questionId = gameStateRaw.gameState.questionIds[currentIndex];
            // Fetch the current question from the DB
            const prisma = await Promise.resolve().then(() => __importStar(require('@/db/prisma'))).then(m => m.prisma);
            const question = await prisma.question.findUnique({ where: { uid: questionId } });
            if (question) {
                // Patch Prisma question to match shared Question type
                const patchedQuestion = {
                    ...question,
                    type: question.questionType || 'single_correct',
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
                // Determine question state and timer for late joiner, considering playMode
                let questionState = 'active';
                let timer = question.timeLimit || 30;
                let phase = 'question';
                let feedbackRemaining = 0;
                const actualFeedbackWaitTime = playMode === 'quiz' ? (question.feedbackWaitTime || 0) : 0;
                if (gameStateRaw && gameStateRaw.gameState && gameStateRaw.gameState.timer) {
                    const timerObj = gameStateRaw.gameState.timer;
                    if (timerObj.isPaused) {
                        if (playMode === 'quiz') {
                            questionState = 'paused';
                            timer = typeof timerObj.timeRemaining === 'number' ? Math.ceil(timerObj.timeRemaining / 1000) : timer;
                        }
                        else { // Tournament
                            // If timer is marked 'isPaused' in a tournament for a late joiner,
                            // it implies the question is not actively taking answers from this joiner's perspective.
                            // Treat as 'stopped'. If timeRemaining is available, use it, else 0.
                            questionState = 'stopped';
                            timer = typeof timerObj.timeRemaining === 'number' ? Math.ceil(timerObj.timeRemaining / 1000) : 0;
                            if (timer <= 0)
                                phase = 'show_answers'; // If effectively expired
                        }
                    }
                    else if (typeof timerObj.startedAt === 'number' && typeof timerObj.duration === 'number') {
                        const elapsed = Date.now() - timerObj.startedAt;
                        const remaining = Math.max(0, timerObj.duration - elapsed);
                        timer = Math.ceil(remaining / 1000);
                        if (remaining <= 0) { // Timer expired
                            timer = 0; // Ensure timer is 0 if expired
                            if (playMode === 'quiz' && actualFeedbackWaitTime > 0) {
                                const feedbackStart = timerObj.startedAt + timerObj.duration;
                                const now = Date.now();
                                if (now < feedbackStart + actualFeedbackWaitTime * 1000) {
                                    phase = 'feedback';
                                    feedbackRemaining = Math.ceil((feedbackStart + actualFeedbackWaitTime * 1000 - now) / 1000);
                                    questionState = 'paused'; // Quiz-specific feedback pause
                                }
                                else {
                                    phase = 'show_answers';
                                    questionState = 'stopped';
                                }
                            }
                            else { // Tournament or quiz with no/past feedback time
                                phase = 'show_answers';
                                questionState = 'stopped';
                            }
                        }
                        else { // Timer still running
                            questionState = 'active';
                        }
                    }
                    else {
                        // No valid timer info (not paused, but no startedAt/duration)
                        questionState = 'stopped';
                        timer = 0;
                    }
                }
                else {
                    // No timer object in gameState at all, or game has ended.
                    questionState = 'stopped'; // Or 'finished' if game ended
                    timer = 0;
                }
                const liveQuestionPayload = {
                    question: filteredQuestion,
                    questionIndex: currentIndex,
                    totalQuestions: gameStateRaw.gameState.questionIds.length,
                    questionState,
                    timer
                };
                if (playMode === 'quiz' && phase === 'feedback' && feedbackRemaining > 0) {
                    liveQuestionPayload.phase = phase;
                    liveQuestionPayload.feedbackRemaining = feedbackRemaining;
                }
                // Log socket ID and room membership for late joiner
                const liveRoom = `live_${accessCode}`;
                const room = io.sockets.adapter.rooms.get(liveRoom);
                const socketIds = room ? Array.from(room) : [];
                logger.info({ accessCode, userId, socketId: socket.id, liveRoom, socketIds }, '[DEBUG] Late joiner socket and current live room members before emitting game_question');
                socket.emit('game_question', liveQuestionPayload);
                logger.info({ accessCode, userId, currentIndex, questionId, questionState, timer, playMode, phase, feedbackRemaining }, '[DEBUG] Emitted game_question to late joiner');
                // --- Late joiner feedback/correct answers logic ---
                // If the question is over for the late joiner (stopped, or quiz-paused for feedback)
                if (questionState === 'stopped' || (playMode === 'quiz' && questionState === 'paused' && phase === 'feedback')) {
                    socket.emit('correct_answers', { questionId });
                    logger.info({ accessCode, userId, questionId, playMode, questionState, phase }, '[DEBUG] Emitted correct_answers to late joiner');
                    if (playMode === 'quiz' && phase === 'feedback' && feedbackRemaining > 0) {
                        socket.emit('feedback', { questionId, feedbackRemaining });
                        logger.info({ accessCode, userId, questionId, feedbackRemaining, playMode }, '[DEBUG] Emitted feedback to late joiner (quiz feedback phase)');
                    }
                }
            }
        }
    };
    // Answer event for both quiz and tournament
    const answerHandler = async (payload) => {
        const { accessCode, userId, questionId, answer, timeSpent, playMode } = payload;
        logger.info({ accessCode, userId, questionId, playMode, answer }, '[DEBUG] Received answer');
        try {
            const redis = await Promise.resolve().then(() => __importStar(require('@/config/redis'))).then(m => m.redisClient);
            const fullGameState = await (0, gameStateService_1.getFullGameState)(accessCode);
            if (!fullGameState || !fullGameState.gameState) {
                logger.warn({ accessCode, userId, questionId }, 'Game state not found for answer validation.');
                socket.emit('answer_feedback', {
                    status: 'error',
                    code: 'GAME_NOT_FOUND',
                    message: 'Jeu non trouvé. Impossible de soumettre la réponse.'
                });
                return;
            }
            const { gameState } = fullGameState;
            // Refined checks for game and question state
            if (gameState.status !== 'active') {
                logger.warn({ accessCode, userId, questionId, gameStatus: gameState.status }, 'Answer submitted but game is not active.');
                socket.emit('answer_feedback', {
                    status: 'error',
                    code: 'GAME_NOT_ACTIVE',
                    message: 'Le jeu n\'est pas actif ou est terminé.'
                });
                return;
            }
            if (gameState.currentQuestionIndex < 0 || gameState.currentQuestionIndex >= gameState.questionIds.length) {
                logger.warn({ accessCode, userId, questionId, currentIndex: gameState.currentQuestionIndex, totalQuestions: gameState.questionIds.length }, 'Answer submitted but no valid question is currently indexed.');
                socket.emit('answer_feedback', {
                    status: 'error',
                    code: 'NO_CURRENT_QUESTION_INDEXED',
                    message: 'Aucune question n\'est actuellement sélectionnée ou le jeu est terminé.'
                });
                return;
            }
            const currentQuestionIdFromState = gameState.questionIds[gameState.currentQuestionIndex];
            const questionTimer = gameState.timer; // This can be undefined
            // 1. Check if questionId matches current question
            // gameState.status !== 'active' is already checked above.
            if (questionId !== currentQuestionIdFromState) {
                logger.warn({ accessCode, userId, submittedQId: questionId, currentQId: currentQuestionIdFromState, gameStatus: gameState.status }, 'Answer submitted for non-current question.');
                socket.emit('answer_feedback', {
                    status: 'error',
                    code: 'INVALID_QUESTION',
                    message: 'Réponse soumise pour une question incorrecte.'
                });
                return;
            }
            // 2. Check time limit
            const timeNow = Date.now();
            let isLate = false;
            if (!questionTimer) {
                logger.warn({ accessCode, userId, questionId }, 'Timer object is missing in gameState. Answer considered late.');
                isLate = true;
            }
            else if (questionTimer.isPaused) {
                logger.info({ accessCode, userId, questionId }, 'Timer is paused. Answer considered late.');
                isLate = true;
            }
            else if (typeof questionTimer.startedAt === 'number' && typeof questionTimer.duration === 'number') {
                // Timer is active and has necessary properties
                if (timeNow > (questionTimer.startedAt + questionTimer.duration)) {
                    logger.info({ accessCode, userId, questionId, now: timeNow, started: questionTimer.startedAt, duration: questionTimer.duration }, 'Answer submitted after timer expired.');
                    isLate = true;
                }
                // else, isLate remains false, answer is on time
            }
            else {
                // Timer object exists but is not in a state where answers can be accepted
                // (e.g., not started, or duration is invalid/missing, or startedAt is missing)
                logger.warn({ accessCode, userId, questionId, questionTimerDetails: JSON.stringify(questionTimer) }, 'Timer not started, duration invalid, or other incomplete timer state. Answer considered late.');
                isLate = true;
            }
            if (isLate) {
                // Consolidated logging for any late condition
                logger.warn({ accessCode, userId, questionId, timerState: questionTimer ? JSON.stringify(questionTimer) : 'undefined' }, 'Answer rejected due to timing conditions (late, paused, or timer not ready).');
                socket.emit('answer_feedback', {
                    status: 'error',
                    code: 'TIME_EXPIRED', // Using a general code for all these timer-related rejections
                    message: 'Délai dépassé, jeu en pause, ou minuteur non actif.'
                });
                return;
            }
            const participantKey = `mathquest:game:participants:${accessCode}`;
            const participantJson = await redis.hget(participantKey, userId);
            let participantData;
            if (participantJson) {
                participantData = JSON.parse(participantJson);
                // Ensure answers array exists
                if (!Array.isArray(participantData.answers)) {
                    participantData.answers = [];
                }
            }
            else {
                // This case should ideally be handled by the join_game/join_tournament logic ensuring participant exists.
                // However, as a fallback, create a new participant structure.
                // Attempt to get username from the socket handshake or a default.
                // This part might need more robust username fetching if this path is commonly hit.
                const socketData = io.sockets.sockets.get(socket.id);
                const usernameFromSocket = socketData?.data?.username || 'Unknown User';
                logger.warn({ accessCode, userId }, 'Participant data not found in Redis for answer submission. Creating with default/socket username.');
                participantData = { userId, username: usernameFromSocket, score: 0, answers: [] };
                // Persist this new participant immediately so they exist for subsequent operations
                await redis.hset(participantKey, userId, JSON.stringify(participantData));
            }
            // Optional: Check if already answered this specific question
            const existingAnswerIndex = participantData.answers.findIndex((ans) => ans.questionId === questionId);
            if (existingAnswerIndex !== -1) {
                logger.info({ accessCode, userId, questionId }, 'Participant already answered this question. Updating answer.');
                // Update existing answer
                participantData.answers[existingAnswerIndex] = {
                    questionId,
                    answer,
                    timeSpent,
                    timestamp: Date.now()
                };
                await redis.hset(participantKey, userId, JSON.stringify(participantData));
                socket.emit('answer_feedback', {
                    status: 'success',
                    code: 'ANSWER_UPDATED',
                    message: 'Réponse mise à jour !'
                });
                return; // Exit after updating
            }
            participantData.answers.push({
                questionId,
                answer,
                timeSpent,
                timestamp: Date.now()
            });
            await redis.hset(participantKey, userId, JSON.stringify(participantData));
            logger.info({ accessCode, userId, questionId }, 'Answer successfully recorded.');
            socket.emit('answer_feedback', {
                status: 'success',
                code: 'ANSWER_SAVED',
                message: 'Réponse enregistrée !'
            });
        }
        catch (error) {
            logger.error({ accessCode, userId, questionId, error }, 'Error processing answer');
            socket.emit('answer_feedback', {
                status: 'error',
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de l\'enregistrement de la réponse.'
            });
        }
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
